"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.device = void 0;
const connection_1 = __importDefault(require("../database/connection"));
exports.device = {
    getAll: async (req, res) => {
        try {
            const { room_name } = req.params;
            if (room_name.trim() === '') {
                return res.status(400).json({ message: 'Room name is required' });
            }
            const [member] = await connection_1.default.query("SELECT * FROM members WHERE user_id = ?;", [req.user?.userId]);
            if (member.length < 1) {
                return res.status(403).json({ message: 'You are not a member of any home' });
            }
            const [rooms] = await connection_1.default.query("SELECT * FROM rooms WHERE name = ? AND home_id = ?;", [room_name, member[0].home_id]);
            if (rooms.length < 1) {
                return res.status(400).json({ message: 'Room not found' });
            }
            const [data] = await connection_1.default.query(`SELECT * FROM devices WHERE room_id IN (${rooms.map(rooms => rooms.id).join(', ')});`);
            console.log(rooms.map(rooms => rooms.id).join(', '));
            res.status(201).json({ message: 'Device fetched successfully', devices: data });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error fetching devices', error: errorMessage });
            console.log(error);
        }
    },
    add: async (req, res) => {
        try {
            const { name, icon, type, device_mac, pin } = req.body;
            if (name.trim() === '' || icon.trim() === '' || type.trim() === '' || device_mac.trim() === '' || pin.trim() === '') {
                return res.status(400).json({ message: 'All fields are required' });
            }
            const [room] = await connection_1.default.query("SELECT id FROM rooms WHERE mac = ?", [device_mac]);
            if (room.length < 1) {
                return res.status(400).json({ message: 'MAC not found' });
            }
            await connection_1.default.query("INSERT INTO devices (name, icon, type, pin, device_mac, room_id) VALUES (?, ?, ?, ?, ?, ?)", [name, icon, type, pin, device_mac, room[0].id]);
            console.log(room);
            res.status(201).json({ message: 'Device added successfully' });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error adding device', error: errorMessage });
            console.log(error);
        }
    },
    addIrButton: async (req, res) => {
        try {
            const { device_id, label, command, protocol, icon, color } = req.body;
            // Validate required fields
            if (!device_id || !label || !command || !protocol || !icon || !color) {
                return res.status(400).json({ message: 'All fields are required: device_id, label, command, protocol, icon, color' });
            }
            // Check if the device exists and is of type 'ir'
            const [device] = await connection_1.default.query("SELECT id, type FROM devices WHERE id = ?", [device_id]);
            if (device.length < 1) {
                return res.status(400).json({ message: 'Device not found' });
            }
            if (device[0].type !== 'ir') {
                return res.status(400).json({ message: 'Device is not an IR device' });
            }
            // Insert the IR button
            const [result] = await connection_1.default.query("INSERT INTO ir_buttons (device_id, label, command, protocol, icon, color) VALUES (?, ?, ?, ?, ?, ?)", [device_id, label, command, protocol, icon, color]);
            res.status(201).json({
                message: 'IR button added successfully',
                buttonId: result.insertId
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error adding IR button', error: errorMessage });
            console.log(error);
        }
    },
    getIrButtons: async (req, res) => {
        try {
            const { device_id } = req.params;
            if (!device_id) {
                return res.status(400).json({ message: 'Device ID is required' });
            }
            // Get IR buttons for the specified device
            const [buttons] = await connection_1.default.query(`SELECT 
                    ib.id,
                    ib.label,
                    ib.command,
                    ib.protocol,
                    ib.icon,
                    ib.color,
                    ib.created_at
                FROM ir_buttons ib
                WHERE ib.device_id = ?
                ORDER BY ib.created_at DESC`, [device_id]);
            res.status(200).json({
                success: true,
                buttons: buttons
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error fetching IR buttons', error: errorMessage });
            console.log(error);
        }
    },
    getIrButtonsByMac: async (req, res) => {
        try {
            const { device_mac } = req.params;
            if (!device_mac) {
                return res.status(400).json({ message: 'Device MAC is required' });
            }
            // Get IR buttons for the specified device by MAC
            const [buttons] = await connection_1.default.query(`SELECT 
                    ib.id,
                    ib.label,
                    ib.command,
                    ib.protocol,
                    ib.icon,
                    ib.color,
                    ib.created_at
                FROM ir_buttons ib
                JOIN devices d ON ib.device_id = d.id
                WHERE d.device_mac = ?
                ORDER BY ib.created_at DESC`, [device_mac]);
            res.status(200).json({
                success: true,
                buttons: buttons
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error fetching IR buttons', error: errorMessage });
            console.log(error);
        }
    },
    deleteIrButton: async (req, res) => {
        try {
            const { buttonId } = req.params;
            if (!buttonId) {
                return res.status(400).json({ message: 'Button ID is required' });
            }
            // Delete the IR button
            const [result] = await connection_1.default.query("DELETE FROM ir_buttons WHERE id = ?", [buttonId]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'IR button not found' });
            }
            res.status(200).json({ message: 'IR button deleted successfully' });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error deleting IR button', error: errorMessage });
            console.log(error);
        }
    },
    update: async (req, res) => {
        try {
            const { device_id } = req.params;
            const { name, icon, type, pin } = req.body;
            if (!device_id) {
                return res.status(400).json({ message: 'Device ID is required' });
            }
            if (name.trim() === '' || icon.trim() === '' || type.trim() === '' || pin.toString().trim() === '') {
                return res.status(400).json({ message: 'All fields are required' });
            }
            // Check if device exists
            const [existingDevice] = await connection_1.default.query("SELECT id FROM devices WHERE id = ?", [device_id]);
            if (existingDevice.length < 1) {
                return res.status(404).json({ message: 'Device not found' });
            }
            // Update the device
            const [result] = await connection_1.default.query("UPDATE devices SET name = ?, icon = ?, type = ?, pin = ? WHERE id = ?", [name, icon, type, pin, device_id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Device not found or no changes made' });
            }
            res.status(200).json({ message: 'Device updated successfully' });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error updating device', error: errorMessage });
            console.log(error);
        }
    },
    delete: async (req, res) => {
        try {
            const { device_id } = req.params;
            if (!device_id) {
                return res.status(400).json({ message: 'Device ID is required' });
            }
            // Check if device exists
            const [existingDevice] = await connection_1.default.query("SELECT id FROM devices WHERE id = ?", [device_id]);
            if (existingDevice.length < 1) {
                return res.status(404).json({ message: 'Device not found' });
            }
            // Delete associated IR buttons first (if any)
            await connection_1.default.query("DELETE FROM ir_buttons WHERE device_id = ?", [device_id]);
            // Delete the device
            const [result] = await connection_1.default.query("DELETE FROM devices WHERE id = ?", [device_id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Device not found' });
            }
            res.status(200).json({ message: 'Device deleted successfully' });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error deleting device', error: errorMessage });
            console.log(error);
        }
    }
};
