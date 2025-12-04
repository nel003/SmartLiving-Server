import { WebSocketServer } from "ws";
import { AuthenticatedRequest } from "./main";
import { deviceSockets, userSockets } from "../utils/sockets";
import pool from "../database/connection";
import { RowDataPacket } from "mysql2";
import logger, { loggerUtils } from "../utils/logger";
import { validateWebSocketMessage } from "../utils/validation";

export function startUserSocket(wss: WebSocketServer) {
    wss.on('userConnection', (ws, req) => {
        const user = (req as AuthenticatedRequest).user;
        const userId = user?.userId || -1;
        const homeId = user?.homeId || -1;

        // Log user connection
        loggerUtils.ws.connection('user', userId.toString(), homeId.toString());
        console.log(`[USER WS] User ${userId} connected to home ${homeId}`);

        userSockets.add(homeId, userId, ws);

        ws.on('message', async (msg: string) => {
            try {
                const rawMessage = JSON.parse(msg.toString());

                // Console log the received message
                console.log(`[USER WS] Received message from user ${userId} (home ${homeId}):`, JSON.stringify(rawMessage, null, 2));

                // Validate message structure
                const validation = validateWebSocketMessage(rawMessage);
                if (!validation.isValid) {
                    loggerUtils.ws.error('user', userId.toString(), new Error(`Invalid message: ${validation.error}`), homeId.toString());
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid message format',
                        details: validation.error
                    }));
                    return;
                }

                const message = validation.data!;
                loggerUtils.ws.message('user', userId.toString(), message, homeId.toString());

                if (message.type === 'init') {
                    try {
                        const startTime = Date.now();
                        const [data] = await pool.query<RowDataPacket[]>(
                            `SELECT
                                d.id,
                                r.mac,
                                d.icon AS device_icon,
                                d.pin AS device_pin,
                                d.type AS device_type,
                                d.base_on_motion AS device_base_on_motion,
                                d.cs_pin AS device_cs_pin
                            FROM
                                rooms AS r
                            JOIN
                                members AS m ON r.home_id = m.home_id
                            JOIN
                                devices AS d ON d.room_id = r.id
                            WHERE
                                m.user_id = ? && d.pin != -1;`,
                            [userId]
                        );

                        const duration = Date.now() - startTime;
                        loggerUtils.db.query(
                            `SELECT
                                d.icon AS device_icon,
                                d.pin AS device_pin,
                                d.type AS device_type
                            FROM
                                rooms AS r
                            JOIN
                                members AS m ON r.home_id = m.home_id
                            JOIN
                                devices AS d ON d.room_id = r.id
                            WHERE
                                m.user_id = ?;`,
                            [userId],
                            duration
                        );

                        // if (data.length > 0) {
                        console.log(`[USER WS] Init data for user ${userId}:`, data);
                        const homeDevicesMap = deviceSockets.getHomeDevices(homeId);
                        if (homeDevicesMap) {
                            const initMessage = JSON.stringify({
                                type: 'init',
                                data: data.map(d => ({
                                    id: d.id,
                                    mac: d.mac,
                                    pin: d.device_pin,
                                    type: d.device_type,
                                    on_motion: d.device_base_on_motion,
                                    cs_pin: d.device_cs_pin,
                                }))
                            });

                            const forwardPromises: Promise<void>[] = [];

                            homeDevicesMap.forEach((deviceConnectionsArray) => {
                                deviceConnectionsArray.forEach((deviceSocket) => {
                                    if (deviceSocket.readyState === deviceSocket.OPEN) {
                                        console.log(`[USER WS] Forwarding init message to device:`, initMessage);
                                        forwardPromises.push(
                                            new Promise<void>((resolve, reject) => {
                                                deviceSocket.send(initMessage, (error) => {
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
                                loggerUtils.ws.error('user', userId.toString(), error as Error, homeId.toString());
                            }
                        }
                        // }
                    } catch (error) {
                        loggerUtils.db.error(error as Error,
                            `SELECT
                                d.icon AS device_icon,
                                d.pin AS device_pin,
                                d.type AS device_type
                            FROM
                                rooms AS r
                            JOIN
                                home_keys AS hk ON r.home_id = hk.id
                            JOIN
                                devices AS d ON d.room_id = r.id
                            WHERE
                                hk.user_id = ?;`,
                            [userId]
                        );
                    }
                } else {
                    // Forward message to devices in the same home
                    const homeDevicesMap = deviceSockets.getHomeDevices(homeId);
                    if (homeDevicesMap) {
                        const forwardPromises: Promise<void>[] = [];

                        homeDevicesMap.forEach((deviceConnectionsArray) => {
                            deviceConnectionsArray.forEach((deviceSocket) => {
                                if (deviceSocket.readyState === deviceSocket.OPEN) {
                                    console.log(`[USER WS] Forwarding message to device:`, msg.toString());
                                    forwardPromises.push(
                                        new Promise<void>((resolve, reject) => {
                                            deviceSocket.send(msg.toString(), (error) => {
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
                            loggerUtils.ws.error('user', userId.toString(), error as Error, homeId.toString());
                        }
                    }
                }
            } catch (error) {
                loggerUtils.ws.error('user', userId.toString(), error as Error, homeId.toString());
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Failed to process message',
                    details: 'Invalid JSON or processing error'
                }));
            }
        });

        ws.on('close', (code: number, reason: Buffer) => {
            loggerUtils.ws.disconnection('user', userId.toString(), homeId.toString());
            console.log(`[USER WS] User ${userId} disconnected from home ${homeId} (code: ${code})`);
            userSockets.remove(homeId, userId, ws);
        });

        ws.on('error', (error: Error) => {
            loggerUtils.ws.error('user', userId.toString(), error, homeId.toString());
        });

        // Send welcome message
        try {
            const welcomeMessage = JSON.stringify({
                type: 'welcome',
                message: `Welcome, ${user?.username}!`,
                userId: userId,
                homeId: homeId
            });
            console.log(`[USER WS] Sending welcome message to user ${userId}:`, welcomeMessage);
            ws.send(welcomeMessage);
        } catch (error) {
            loggerUtils.ws.error('user', userId.toString(), error as Error, homeId.toString());
        }
    });
}