import { Server } from "http";
import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { wsValidateUser } from "../middleware/wsValidateUser";
import url  from "url";
import { wsValidateDevice } from "../middleware/wsValidateDevice";

export interface AuthenticatedRequest extends IncomingMessage {
    user?: {
        userId?: number;
        username?: string;
        homeId?: number;
        accessToken?: string;
        refreshToken?: string;
    };
    device?: {
        id?: number;
        deviceId?: number;
        homeId?: number;
        mac?: string;
        deviceName?: string;
        token?: string;
    };
}

export const startWebSocketServer = (server: Server, wss: WebSocketServer) => {
    server.on('upgrade', async (req: AuthenticatedRequest, socket, head) => {
        const { pathname, query } = url.parse(req.url || "", true);
        if(pathname === "/ws/user") {
            const refreshToken = query.refreshToken as string
            const accessToken = query.accessToken as string
            // console.log("WebSocket connection attempt with accessToken:", accessToken, "and refreshToken:", refreshToken);
            if (!accessToken || !refreshToken) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
            return;
            }

            const user = await wsValidateUser(refreshToken, accessToken)
            if(!user.success) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }
            req.user = user
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('userConnection', ws, req)
            })
        } else if (pathname === "/ws/iot") {
            const token = query.token as string
            const deviceName = query.deviceName as string
            const mac = query.mac as string
            console.log(token, deviceName, mac);
            
            if (!token || !deviceName || !mac) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }

            const device =  await wsValidateDevice(token, deviceName, mac);
            if(!device.success) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }
            req.device = device
            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('iotConnection', ws, req); 
            });
        } else {
            socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
            socket.destroy();
            return;
        }

    });
}