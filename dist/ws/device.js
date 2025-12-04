"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDeviceSocket = startDeviceSocket;
const sockets_1 = require("../utils/sockets");
const pushNotification_1 = __importDefault(require("../utils/pushNotification"));
const connection_1 = __importDefault(require("../database/connection"));
const logger_1 = require("../utils/logger");
const validation_1 = require("../utils/validation");
function startDeviceSocket(wss) {
    wss.on('iotConnection', (ws, req) => {
        const device = req.device;
        const deviceId = device?.id || -1;
        const homeId = device?.homeId || -1;
        // Log device connection
        logger_1.loggerUtils.ws.connection('device', deviceId.toString(), homeId.toString());
        console.log(`[DEVICE WS] Device ${deviceId} connected to home ${homeId}`);
        sockets_1.deviceSockets.add(homeId, deviceId, ws);
        ws.isAlive = true;
        ws.on('pong', () => {
            ws.isAlive = true;
        });
        ws.on('message', async (msg) => {
            try {
                const rawMessage = JSON.parse(msg.toString());
                // Console log the received message
                console.log(`[DEVICE WS] Received message from device ${deviceId} (home ${homeId}):`, JSON.stringify(rawMessage, null, 2));
                // Validate message structure
                const validation = (0, validation_1.validateWebSocketMessage)(rawMessage);
                if (!validation.isValid) {
                    logger_1.loggerUtils.ws.error('device', deviceId.toString(), new Error(`Invalid message: ${validation.error}`), homeId.toString());
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid message format',
                        details: validation.error
                    }));
                    return;
                }
                const message = validation.data;
                logger_1.loggerUtils.ws.message('device', deviceId.toString(), message, homeId.toString());
                if (message.type === "motion") {
                    try {
                        logger_1.loggerUtils.device.motion(deviceId, homeId);
                        const [data] = await connection_1.default.query(`SELECT
                                pnt.token AS token
                            FROM 
                                home_keys AS hk
                            JOIN 
                                users AS u ON hk.user_id = u.id
                            JOIN push_notif_token AS pnt ON u.id = pnt.user_id
                            WHERE hk.id = ?;`, [homeId]);
                        const tokens = data.map((d) => d.token);
                        const notificationPromises = tokens.map(async (token) => {
                            try {
                                await (0, pushNotification_1.default)("Motion Detected", `Motion detected at ${device?.deviceName}`, token);
                                logger_1.loggerUtils.push.sent(token, "Motion Detected", true);
                            }
                            catch (error) {
                                logger_1.loggerUtils.push.error(token, error);
                            }
                        });
                        await Promise.allSettled(notificationPromises);
                    }
                    catch (error) {
                        logger_1.loggerUtils.db.error(error, `SELECT pnt.token FROM home_keys AS hk JOIN users AS u ON hk.user_id = u.id JOIN push_notif_token AS pnt ON u.id = pnt.user_id WHERE hk.id = ?`, [homeId]);
                    }
                }
                else {
                    // Forward message to users in the same home
                    const homeUsersMap = sockets_1.userSockets.getHomeUsers(homeId);
                    if (homeUsersMap) {
                        const forwardPromises = [];
                        homeUsersMap.forEach((userConnectionsArray) => {
                            userConnectionsArray.forEach((userSocket) => {
                                if (userSocket.readyState === userSocket.OPEN) {
                                    console.log(`[DEVICE WS] Forwarding message to user:`, msg.toString());
                                    forwardPromises.push(new Promise((resolve, reject) => {
                                        userSocket.send(msg.toString(), (error) => {
                                            if (error) {
                                                reject(error);
                                            }
                                            else {
                                                resolve();
                                            }
                                        });
                                    }));
                                }
                            });
                        });
                        try {
                            await Promise.allSettled(forwardPromises);
                        }
                        catch (error) {
                            logger_1.loggerUtils.ws.error('device', deviceId.toString(), error, homeId.toString());
                        }
                    }
                }
            }
            catch (error) {
                logger_1.loggerUtils.ws.error('device', deviceId.toString(), error, homeId.toString());
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Failed to process message',
                    details: 'Invalid JSON or processing error'
                }));
            }
        });
        ws.on('close', (code, reason) => {
            logger_1.loggerUtils.ws.disconnection('device', deviceId.toString(), homeId.toString());
            console.log(`[DEVICE WS] Device ${deviceId} disconnected from home ${homeId} (code: ${code})`);
            sockets_1.deviceSockets.remove(homeId, deviceId, ws);
        });
        ws.on('error', (error) => {
            logger_1.loggerUtils.ws.error('device', deviceId.toString(), error, homeId.toString());
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
        }
        catch (error) {
            logger_1.loggerUtils.ws.error('device', deviceId.toString(), error, homeId.toString());
        }
    });
    const interval = setInterval(() => {
        sockets_1.deviceSockets.getAll().forEach((deviceMapForHome, homeId) => {
            deviceMapForHome.forEach((deviceConnectionsArray, deviceId) => {
                const socketsToProcess = [];
                deviceConnectionsArray.forEach((deviceSocket) => {
                    const extSocket = deviceSocket;
                    if (extSocket.isAlive === false) {
                        socketsToProcess.push({ socket: extSocket, terminate: true });
                    }
                    else {
                        socketsToProcess.push({ socket: extSocket, terminate: false });
                        extSocket.isAlive = false;
                        extSocket.ping();
                    }
                });
                socketsToProcess.forEach(({ socket, terminate }) => {
                    if (terminate) {
                        console.log(`Device ${deviceId} connection in Home ${homeId} is not alive. Terminating and removing.`);
                        socket.terminate();
                        sockets_1.deviceSockets.remove(homeId, deviceId, socket);
                    }
                });
            });
        });
    }, 5000);
    wss.on('close', () => {
        clearInterval(interval);
    });
}
