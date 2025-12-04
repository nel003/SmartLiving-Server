"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startUserSocket = startUserSocket;
const sockets_1 = require("../utils/sockets");
const connection_1 = __importDefault(require("../database/connection"));
const logger_1 = require("../utils/logger");
const validation_1 = require("../utils/validation");
function startUserSocket(wss) {
    wss.on('userConnection', (ws, req) => {
        const user = req.user;
        const userId = user?.userId || -1;
        const homeId = user?.homeId || -1;
        // Log user connection
        logger_1.loggerUtils.ws.connection('user', userId.toString(), homeId.toString());
        console.log(`[USER WS] User ${userId} connected to home ${homeId}`);
        sockets_1.userSockets.add(homeId, userId, ws);
        ws.on('message', async (msg) => {
            try {
                const rawMessage = JSON.parse(msg.toString());
                // Console log the received message
                console.log(`[USER WS] Received message from user ${userId} (home ${homeId}):`, JSON.stringify(rawMessage, null, 2));
                // Validate message structure
                const validation = (0, validation_1.validateWebSocketMessage)(rawMessage);
                if (!validation.isValid) {
                    logger_1.loggerUtils.ws.error('user', userId.toString(), new Error(`Invalid message: ${validation.error}`), homeId.toString());
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid message format',
                        details: validation.error
                    }));
                    return;
                }
                const message = validation.data;
                logger_1.loggerUtils.ws.message('user', userId.toString(), message, homeId.toString());
                if (message.type === 'init') {
                    try {
                        const startTime = Date.now();
                        const [data] = await connection_1.default.query(`SELECT
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
                                hk.user_id = ?;`, [userId]);
                        const duration = Date.now() - startTime;
                        logger_1.loggerUtils.db.query(`SELECT d.icon AS device_icon, d.pin AS device_pin, d.type AS device_type FROM rooms AS r JOIN home_keys AS hk ON r.home_id = hk.id JOIN devices AS d ON d.room_id = r.id WHERE hk.user_id = ?`, [userId], duration);
                        if (data.length > 0) {
                            const homeDevicesMap = sockets_1.deviceSockets.getHomeDevices(homeId);
                            if (homeDevicesMap) {
                                const initMessage = JSON.stringify({
                                    type: 'init',
                                    pins: data.map((d) => d.device_pin)
                                });
                                const forwardPromises = [];
                                homeDevicesMap.forEach((deviceConnectionsArray) => {
                                    deviceConnectionsArray.forEach((deviceSocket) => {
                                        if (deviceSocket.readyState === deviceSocket.OPEN) {
                                            console.log(`[USER WS] Forwarding init message to device:`, initMessage);
                                            forwardPromises.push(new Promise((resolve, reject) => {
                                                deviceSocket.send(initMessage, (error) => {
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
                                    logger_1.loggerUtils.ws.error('user', userId.toString(), error, homeId.toString());
                                }
                            }
                        }
                    }
                    catch (error) {
                        logger_1.loggerUtils.db.error(error, `SELECT d.icon AS device_icon, d.pin AS device_pin, d.type AS device_type FROM rooms AS r JOIN home_keys AS hk ON r.home_id = hk.id JOIN devices AS d ON d.room_id = r.id WHERE hk.user_id = ?`, [userId]);
                    }
                }
                else {
                    // Forward message to devices in the same home
                    const homeDevicesMap = sockets_1.deviceSockets.getHomeDevices(homeId);
                    if (homeDevicesMap) {
                        const forwardPromises = [];
                        homeDevicesMap.forEach((deviceConnectionsArray) => {
                            deviceConnectionsArray.forEach((deviceSocket) => {
                                if (deviceSocket.readyState === deviceSocket.OPEN) {
                                    console.log(`[USER WS] Forwarding message to device:`, msg.toString());
                                    forwardPromises.push(new Promise((resolve, reject) => {
                                        deviceSocket.send(msg.toString(), (error) => {
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
                            logger_1.loggerUtils.ws.error('user', userId.toString(), error, homeId.toString());
                        }
                    }
                }
            }
            catch (error) {
                logger_1.loggerUtils.ws.error('user', userId.toString(), error, homeId.toString());
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Failed to process message',
                    details: 'Invalid JSON or processing error'
                }));
            }
        });
        ws.on('close', (code, reason) => {
            logger_1.loggerUtils.ws.disconnection('user', userId.toString(), homeId.toString());
            console.log(`[USER WS] User ${userId} disconnected from home ${homeId} (code: ${code})`);
            sockets_1.userSockets.remove(homeId, userId, ws);
        });
        ws.on('error', (error) => {
            logger_1.loggerUtils.ws.error('user', userId.toString(), error, homeId.toString());
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
        }
        catch (error) {
            logger_1.loggerUtils.ws.error('user', userId.toString(), error, homeId.toString());
        }
    });
}
