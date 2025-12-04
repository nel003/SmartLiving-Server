"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rooms = void 0;
const connection_1 = __importDefault(require("../database/connection"));
exports.rooms = {
    get: async (req, res) => {
        try {
            const [data] = await connection_1.default.query(`SELECT
                    r.id AS room_id,
                    r.name AS room_name,
                    r.mac AS room_mac
                FROM
                    rooms AS r
                JOIN
                    home_keys AS hk ON r.home_id = hk.id
                JOIN 
                    members AS m ON r.home_id = m.home_id
                WHERE
                    m.user_id = ?;`, [req.user?.userId]);
            if (data.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No devices found for this home'
                });
            }
            return res.status(200).json({
                success: true,
                rooms: data
            });
        }
        catch (error) {
            console.error('Error fetching devices:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
};
