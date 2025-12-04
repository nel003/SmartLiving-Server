import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import pool from "../database/connection";
import { ResultSetHeader, RowDataPacket } from "mysql2";

interface DeviceTokenPayload {
    uuid: string;
}

export const wsValidateDevice = async (token: string, deviceName: string, mac: string) => {
    try {
        let accessTokenPayload: DeviceTokenPayload;
        try {
            accessTokenPayload = jwt.verify(
                token,
                process.env.JWT_KEY_SECRET || "JWT_KEY_SECRET"
            ) as DeviceTokenPayload;
        } catch (error) {
            return {
                success: false,
                message: 'Invalid access token'
            }
        }

        const [keys] = await pool.query<RowDataPacket[]>("SELECT * FROM home_keys WHERE value = ?", [accessTokenPayload.uuid]);
        if (keys.length === 0) {
            return {
                success: false,
                message: 'Invalid access token'
            }
        }

        const [rooms] = await pool.query<RowDataPacket[]>("SELECT * FROM rooms WHERE name = ? AND mac = ? AND home_id = ?", [deviceName, mac, keys[0].id]);
        if (rooms.length === 0) {
            const q = await pool.query<ResultSetHeader>("INSERT INTO rooms (name, mac, home_id) VALUES (?, ?, ?)", [deviceName, mac, keys[0].id]);
            return {
                success: true,
                deviceId: q[0].insertId,
                homeId: keys[0].id,
                mac,
                deviceName: deviceName,
                uuid: accessTokenPayload.uuid
            }
        }

        console.log(rooms);

        return {
            success: true,
            deviceId: rooms[0].id,
            homeId: keys[0].id,
            mac,
            deviceName: deviceName,
            uuid: accessTokenPayload.uuid
        }
    } catch (error) {
        console.error("Device validation error:", error);
        return {
            success: false,
            message: "Internal server error"
        }
    }
}