"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWebSocketServer = void 0;
const wsValidateUser_1 = require("../middleware/wsValidateUser");
const url_1 = __importDefault(require("url"));
const wsValidateDevice_1 = require("../middleware/wsValidateDevice");
const startWebSocketServer = (server, wss) => {
    server.on('upgrade', async (req, socket, head) => {
        const { pathname, query } = url_1.default.parse(req.url || "", true);
        if (pathname === "/ws/user") {
            const refreshToken = query.refreshToken;
            const accessToken = query.accessToken;
            if (!accessToken || !refreshToken) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }
            const user = await (0, wsValidateUser_1.wsValidateUser)(refreshToken, accessToken);
            if (!user.success) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }
            req.user = user;
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('userConnection', ws, req);
            });
        }
        else if (pathname === "/ws/iot") {
            const token = query.token;
            const deviceName = query.deviceName;
            const mac = query.mac;
            if (!token || !deviceName || !mac) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }
            const device = await (0, wsValidateDevice_1.wsValidateDevice)(token, deviceName, mac);
            if (!device.success) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }
            req.device = device;
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('iotConnection', ws, req);
            });
        }
        else {
            socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
            socket.destroy();
            return;
        }
    });
};
exports.startWebSocketServer = startWebSocketServer;
