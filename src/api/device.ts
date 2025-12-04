import { Request, Response } from 'express';
import pool from '../database/connection';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const device = {
    getAll: async (req: Request, res: Response) => {
        try {
            const { room_name } = req.params;

            if (room_name.trim() === '') {
                return res.status(400).json({ message: 'Room name is required' });
            }

            const [member] = await pool.query<RowDataPacket[]>("SELECT * FROM members WHERE user_id = ?;", [req.user?.userId]);
            if (member.length < 1) {
                return res.status(403).json({ message: 'You are not a member of any home' });
            }

            const [rooms] = await pool.query<RowDataPacket[]>("SELECT * FROM rooms WHERE name = ? AND home_id = ?;", [room_name, member[0].home_id]);
            if (rooms.length < 1) {
                return res.status(400).json({ message: 'Room not found' });
            }

            const [data] = await pool.query<RowDataPacket[]>(`SELECT * FROM devices WHERE room_id IN (${rooms.map(rooms => rooms.id).join(', ')});`);
            console.log(rooms.map(rooms => rooms.id).join(', '));
            res.status(201).json({ message: 'Device fetched successfully', devices: data });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error fetching devices', error: errorMessage });
            console.log(error);
        }
    },
    all: async (req: Request, res: Response) => {
        try {
            const [member] = await pool.query<RowDataPacket[]>("SELECT * FROM members WHERE user_id = ?;", [req.user?.userId]);
            if (member.length < 1) {
                return res.status(403).json({ message: 'You are not a member of any home' });
            }

            const [data] = await pool.query<RowDataPacket[]>(`SELECT * FROM devices WHERE room_id IN (SELECT id FROM rooms WHERE home_id = ?);`, [member[0].home_id]);
            res.status(201).json({ message: 'Device fetched successfully', devices: data });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error fetching devices', error: errorMessage });
            console.log(error);
        }
    },
    add: async (req: Request, res: Response) => {
        try {
            const { name, icon, type, device_mac, pin, cs_pin, base_on_motion } = req.body;
            console.log(req.body);
            
            if (name.trim() === '' || icon.trim() === '' || type.trim() === '' || device_mac.trim() === '' || cs_pin.trim() === '' || base_on_motion.toString().trim() === '') {
                return res.status(400).json({ message: 'All fields are required' });
            }

            if (type.trim() === 'relay' && pin.trim() === '') {
                return res.status(400).json({ message: 'All fields are required' });
            }

            const [room] = await pool.query<RowDataPacket[]>("SELECT id FROM rooms WHERE mac = ?", [device_mac]);
            if (room.length < 1) {
                return res.status(400).json({ message: 'MAC not found' });
            }

            await pool.query("INSERT INTO devices (name, icon, type, pin, cs_pin, device_mac, room_id, base_on_motion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [name, icon, type, type === "relay" ? pin : -1, cs_pin === -1 ? null : cs_pin, device_mac, room[0].id, base_on_motion]);
            console.log(room);
            res.status(201).json({ message: 'Device added successfully' });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error adding device', error: errorMessage });
            console.log(error);
        }
    },

    addIrButton: async (req: Request, res: Response) => {
        try {
            const { device_id, label, command, address, protocol, icon, color } = req.body;

            // Validate required fields
            if (!device_id || !label || !command || !protocol || !icon || !color) {
                return res.status(400).json({ message: 'All fields are required: device_id, label, command, protocol, icon, color' });
            }

            // Check if the device exists and is of type 'ir'
            const [device] = await pool.query<RowDataPacket[]>(
                "SELECT id, type FROM devices WHERE id = ?",
                [device_id]
            );

            if (device.length < 1) {
                return res.status(400).json({ message: 'Device not found' });
            }

            if (device[0].type !== 'ir') {
                return res.status(400).json({ message: 'Device is not an IR device' });
            }

            // Insert the IR button
            const [result] = await pool.query<ResultSetHeader>(
                "INSERT INTO ir_buttons (device_id, label, command, address, protocol, icon, color) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [device_id, label, command, address, protocol, icon, color]
            );

            res.status(201).json({ 
                message: 'IR button added successfully',
                buttonId: result.insertId
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error adding IR button', error: errorMessage });
            console.log(error);
        }
    },

    getIrButtons: async (req: Request, res: Response) => {
        try {
            const { device_id } = req.params;

            if (!device_id) {
                return res.status(400).json({ message: 'Device ID is required' });
            }

            // Get IR buttons for the specified device
            const [buttons] = await pool.query<RowDataPacket[]>(
                `SELECT 
                    ib.id,
                    ib.label,
                    ib.command,
                    ib.address,
                    ib.protocol,
                    ib.icon,
                    ib.color,
                    ib.created_at
                FROM ir_buttons ib
                WHERE ib.device_id = ?
                ORDER BY ib.created_at DESC`,
                [device_id]
            );

            res.status(200).json({ 
                success: true,
                buttons: buttons
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error fetching IR buttons', error: errorMessage });
            console.log(error);
        }
    },

    getIrButtonsByMac: async (req: Request, res: Response) => {
        try {
            const { device_mac } = req.params;

            if (!device_mac) {
                return res.status(400).json({ message: 'Device MAC is required' });
            }

            // Get IR buttons for the specified device by MAC
            const [buttons] = await pool.query<RowDataPacket[]>(
                `SELECT 
                    ib.id,
                    ib.label,
                    ib.command,
                    ib.address,
                    ib.protocol,
                    ib.icon,
                    ib.color,
                    ib.created_at
                FROM ir_buttons ib
                JOIN devices d ON ib.device_id = d.id
                WHERE d.device_mac = ?
                ORDER BY ib.created_at DESC`,
                [device_mac]
            );

            res.status(200).json({ 
                success: true,
                buttons: buttons
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error fetching IR buttons', error: errorMessage });
            console.log(error);
        }
    },

    deleteIrButton: async (req: Request, res: Response) => {
        try {
            const { buttonId } = req.params;

            if (!buttonId) {
                return res.status(400).json({ message: 'Button ID is required' });
            }

            // Delete the IR button
            const [result] = await pool.query<ResultSetHeader>(
                "DELETE FROM ir_buttons WHERE id = ?",
                [buttonId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'IR button not found' });
            }

            res.status(200).json({ message: 'IR button deleted successfully' });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error deleting IR button', error: errorMessage });
            console.log(error);
        }
    },

    update: async (req: Request, res: Response) => {
        try {
            const { device_id } = req.params;
            const { name, icon, type, pin, device_mac, cs_pin, base_on_motion } = req.body;
            console.log(req.body);

            if (!device_id) {
                return res.status(400).json({ message: 'Device ID is required' });
            }

            if (name.trim() === '' || icon.trim() === '' || type.trim() === '' || device_mac.toString().trim() === '' || cs_pin.toString().trim() === '' || base_on_motion.toString().trim() === '') {
                return res.status(400).json({ message: 'All fields are required' });
            }

            if (type.trim() === 'relay' && pin.trim() === '') {
                return res.status(400).json({ message: 'All fields are required' });
            }

            // Check if device exists
            const [existingDevice] = await pool.query<RowDataPacket[]>(
                "SELECT id FROM devices WHERE id = ?",
                [device_id]
            );

            if (existingDevice.length < 1) {
                return res.status(404).json({ message: 'Device not found' });
            }

            // Update the device
            const [result] = await pool.query<ResultSetHeader>(
                "UPDATE devices SET name = ?, icon = ?, device_mac = ?, type = ?, pin = ?, cs_pin = ?, base_on_motion = ? WHERE id = ?",
                [name, icon, device_mac, type, pin, cs_pin, base_on_motion, device_id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Device not found or no changes made' });
            }

            res.status(200).json({ message: 'Device updated successfully' });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error updating device', error: errorMessage });
            console.log(error);
        }
    },

    delete: async (req: Request, res: Response) => {
        try {
            const { device_id } = req.params;

            if (!device_id) {
                return res.status(400).json({ message: 'Device ID is required' });
            }

            // Check if device exists
            const [existingDevice] = await pool.query<RowDataPacket[]>(
                "SELECT id FROM devices WHERE id = ?",
                [device_id]
            );

            if (existingDevice.length < 1) {
                return res.status(404).json({ message: 'Device not found' });
            }

            // Delete associated IR buttons first (if any)
            await pool.query("DELETE FROM ir_buttons WHERE device_id = ?", [device_id]);

            // Delete the device
            const [result] = await pool.query<ResultSetHeader>(
                "DELETE FROM devices WHERE id = ?",
                [device_id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Device not found' });
            }

            res.status(200).json({ message: 'Device deleted successfully' });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error deleting device', error: errorMessage });
            console.log(error);
        }
    }
}