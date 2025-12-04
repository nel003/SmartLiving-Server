"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wsValidateDevice = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connection_1 = __importDefault(require("../database/connection"));
const wsValidateDevice = async (token, deviceName, mac) => {
    try {
        let accessTokenPayload;
        try {
            accessTokenPayload = jsonwebtoken_1.default.verify(token, process.env.JWT_KEY_SECRET || "JWT_KEY_SECRET");
        }
        catch (error) {
            return {
                success: false,
                message: 'Invalid access token'
            };
        }
        const [keys] = await connection_1.default.query("SELECT * FROM home_keys WHERE value = ?", [accessTokenPayload.uuid]);
        if (keys.length === 0) {
            return {
                success: false,
                message: 'Invalid access token'
            };
        }
        const [rooms] = await connection_1.default.query("SELECT * FROM rooms WHERE name = ? AND mac = ? AND home_id = ?", [deviceName, mac, keys[0].id]);
        if (rooms.length === 0) {
            await connection_1.default.query("INSERT INTO rooms (name, mac, home_id) VALUES (?, ?, ?)", [deviceName, mac, keys[0].id]);
        }
        return {
            success: true,
            homeId: keys[0].id,
            mac,
            deviceName: deviceName,
            uuid: accessTokenPayload.uuid
        };
    }
    catch (error) {
        console.error("Device validation error:", error);
        return {
            success: false,
            message: "Internal server error"
        };
    }
};
exports.wsValidateDevice = wsValidateDevice;
