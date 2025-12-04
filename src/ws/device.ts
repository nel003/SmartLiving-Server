import { WebSocketServer } from "ws";
import { AuthenticatedRequest } from "./main";
import { deviceSockets, ExtWebSocket, userSockets } from "../utils/sockets";
import pushNotification from "../utils/pushNotification";
import pool from "../database/connection";
import { RowDataPacket } from "mysql2";
import logger, { loggerUtils } from "../utils/logger";
import { validateWebSocketMessage } from "../utils/validation";


export function startDeviceSocket(wss: WebSocketServer) {
    wss.on('iotConnection', (ws: ExtWebSocket, req) => {
        const device = (req as AuthenticatedRequest).device;
        const deviceId = device?.deviceId || -1;
        const homeId = device?.homeId || -1;

        // Log device connection
        loggerUtils.ws.connection('device', deviceId.toString(), homeId.toString());
        console.log(`[DEVICE WS] Device ${deviceId} connected to home ${homeId}`);

        deviceSockets.add(homeId, deviceId, ws);

        ws.isAlive = true;
        ws.on('pong', () => {
            ws.isAlive = true;
        });

        ws.on('message', async (msg: string) => {
            try {
                const rawMessage = JSON.parse(msg.toString());

                // Console log the received message
                console.log(`[DEVICE WS] Received message from device ${deviceId} (home ${homeId}):`, JSON.stringify(rawMessage, null, 2));

                // Validate message structure
                const validation = validateWebSocketMessage(rawMessage);
                if (!validation.isValid) {
                    loggerUtils.ws.error('device', deviceId.toString(), new Error(`Invalid message: ${validation.error}`), homeId.toString());
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid message format',
                        details: validation.error
                    }));
                    return;
                }

                const message = validation.data!;
                loggerUtils.ws.message('device', deviceId.toString(), message, homeId.toString());

                if (message.type === "motion") {
                    try {
                        loggerUtils.device.motion(deviceId, homeId);

                        const [data] = await pool.query<RowDataPacket[]>(
                            `SELECT
                                pnt.token AS token
                            FROM 
                                members AS m
                            JOIN 
                                users AS u ON m.user_id = u.id
                            JOIN push_notif_token AS pnt ON u.id = pnt.user_id
                            WHERE m.home_id = ?;`,
                            [homeId]
                        );
                        console.log(data);
                        const tokens = data.map((d) => d.token);
                        const notificationPromises = tokens.map(async (token) => {
                            try {
                                await pushNotification("Motion Detected", `Motion detected at ${device?.deviceName}`, token);
                                loggerUtils.push.sent(token, "Motion Detected", true);
                            } catch (error) {
                                loggerUtils.push.error(token, error as Error);
                            }
                        });

                        await Promise.allSettled(notificationPromises);

                    } catch (error) {
                        loggerUtils.db.error(error as Error,
                            `SELECT
                                pnt.token AS token
                            FROM 
                                members AS m
                            JOIN 
                                users AS u ON m.user_id = u.id
                            JOIN push_notif_token AS pnt ON u.id = pnt.user_id
                            WHERE m.id = ?;`,
                            [homeId]
                        );
                    }
                } else if (message.type === 'energy') {
                    // Handle energy data
                    const energyData = Array.isArray(message.data) ? message.data : [message];

                    for (const data of energyData) {
                        // We only care about address 1 for now
                        if (data.address == 1) {
                            try {
                                // Check the last time we stored data for this device and address
                                const [rows] = await pool.query<RowDataPacket[]>(
                                    `SELECT created_at FROM energy_data 
                                     WHERE device_id = ? AND address = ? 
                                     ORDER BY created_at DESC LIMIT 1`,
                                    [deviceId, 1]
                                );

                                let shouldStore = false;

                                if (rows.length === 0) {
                                    shouldStore = true;
                                } else {
                                    const lastStored = new Date(rows[0].created_at).getTime();
                                    const now = new Date().getTime();
                                    const hoursDiff = (now - lastStored) / (1000 * 60 * 60);

                                    if (hoursDiff >= 1) {
                                        shouldStore = true;
                                    }
                                }

                                if (shouldStore) {
                                    await pool.query(
                                        `INSERT INTO energy_data 
                                        (device_id, home_id, address, frequency, voltage, current, active_power, reactive_power, apparent_power, power_factor, active_energy) 
                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                        [
                                            deviceId,
                                            homeId,
                                            data.address,
                                            data.frequency || 0,
                                            data.voltage || 0,
                                            data.current || 0,
                                            data.active_power || 0,
                                            data.reactive_power || 0,
                                            data.apparent_power || 0,
                                            data.power_factor || 0,
                                            data.active_energy || 0
                                        ]
                                    );
                                    console.log(`[DEVICE WS] Stored hourly energy data for device ${deviceId}, address 1`);
                                }
                            } catch (error) {
                                loggerUtils.db.error(error as Error, 'Energy data storage');
                            }
                        }
                    }

                    // Forward message to users in the same home (existing logic)
                    const homeUsersMap = userSockets.getHomeUsers(homeId);

                    if (homeUsersMap) {
                        const forwardPromises: Promise<void>[] = [];

                        homeUsersMap.forEach((userConnectionsArray) => {
                            userConnectionsArray.forEach((userSocket) => {
                                if (userSocket.readyState === userSocket.OPEN) {
                                    // console.log(`[DEVICE WS] Forwarding message to user:`, msg.toString());
                                    forwardPromises.push(
                                        new Promise<void>((resolve, reject) => {
                                            userSocket.send(msg.toString(), (error) => {
                                                if (error) {
                                                    reject(error);
                                                } else {
                                                    resolve();
                                                }
                                            });
                                        })
                                    );
                                }
                            });
                        });

                        try {
                            await Promise.allSettled(forwardPromises);
                        } catch (error) {
                            loggerUtils.ws.error('device', deviceId.toString(), error as Error, homeId.toString());
                        }
                    }
                } else {
                    // Forward message to users in the same home
                    const homeUsersMap = userSockets.getHomeUsers(homeId);



                    if (homeUsersMap) {
                        const forwardPromises: Promise<void>[] = [];

                        homeUsersMap.forEach((userConnectionsArray) => {
                            userConnectionsArray.forEach((userSocket) => {
                                if (userSocket.readyState === userSocket.OPEN) {
                                    console.log(`[DEVICE WS] Forwarding message to user:`, msg.toString());
                                    forwardPromises.push(
                                        new Promise<void>((resolve, reject) => {
                                            userSocket.send(msg.toString(), (error) => {
                                                if (error) {
                                                    reject(error);
                                                } else {
                                                    resolve();
                                                }
                                            });
                                        })
                                    );
                                }
                            });
                        });

                        try {
                            await Promise.allSettled(forwardPromises);
                        } catch (error) {
                            loggerUtils.ws.error('device', deviceId.toString(), error as Error, homeId.toString());
                        }
                    }
                }
            } catch (error) {
                loggerUtils.ws.error('device', deviceId.toString(), error as Error, homeId.toString());
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Failed to process message',
                    details: 'Invalid JSON or processing error'
                }));
            }
        });

        ws.on('close', (code: number, reason: Buffer) => {
            loggerUtils.ws.disconnection('device', deviceId.toString(), homeId.toString());
            console.log(`[DEVICE WS] Device ${deviceId} disconnected from home ${homeId} (code: ${code})`);
            deviceSockets.remove(homeId, deviceId, ws);
        });

        ws.on('error', (error: Error) => {
            loggerUtils.ws.error('device', deviceId.toString(), error, homeId.toString());
        });

        // Send welcome message
        try {
            const welcomeMessage = JSON.stringify({
                type: 'welcome',
                message: `Welcome, ${device?.deviceName}!`,
                deviceId: deviceId,
                homeId: homeId
            });
            console.log(`[DEVICE WS] Sending welcome message to device ${deviceId}:`, welcomeMessage);
            ws.send(welcomeMessage);
        } catch (error) {
            loggerUtils.ws.error('device', deviceId.toString(), error as Error, homeId.toString());
        }
    });

    const interval = setInterval(() => {
        deviceSockets.getAll().forEach((deviceMapForHome, homeId) => {
            deviceMapForHome.forEach((deviceConnectionsArray, deviceId) => {
                const socketsToProcess: { socket: ExtWebSocket, terminate: boolean }[] = [];

                deviceConnectionsArray.forEach((deviceSocket) => {
                    const extSocket = deviceSocket as ExtWebSocket;
                    if (extSocket.isAlive === false) {
                        socketsToProcess.push({ socket: extSocket, terminate: true });
                    } else {
                        socketsToProcess.push({ socket: extSocket, terminate: false });
                        extSocket.isAlive = false;
                        extSocket.ping();
                    }
                });

                socketsToProcess.forEach(({ socket, terminate }) => {
                    if (terminate) {
                        console.log(`Device ${deviceId} connection in Home ${homeId} is not alive. Terminating and removing.`);
                        socket.terminate();
                        deviceSockets.remove(homeId, deviceId, socket);
                    }
                });
            });
        });
    }, 5000);

    wss.on('close', () => {
        clearInterval(interval);
    });
}