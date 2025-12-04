import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool from '../../database/connection';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const homeKey = {
    createKey:  async (req: Request, res: Response) => {
        try {
            const uuid = uuidv4();
            
            const [keyCount] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM members WHERE user_id = ?', [req.user?.userId]);
            if (keyCount[0].count > 0) { 
                return res.status(400).json({ error: 'You have a key already' });
            }

            const home = await pool.query<ResultSetHeader>('INSERT INTO home_keys (label, value) VALUES (?, ?)', ["HOME", uuid]);
            const token = jwt.sign({ uuid }, process.env.JWT_KEY_SECRET || "JWT_KEY_SECRET");
            // console.log(home);
            await pool.query<ResultSetHeader>('INSERT INTO members (is_admin, home_id, user_id) VALUES (?, ?, ?)', [true, home[0].insertId, req.user?.userId]);

            return res.json({ token });
        } catch (error) {
                console.error('Key generation error:', error);
                res.status(500).json({ error: 'Key generation failed' });
        }
    },
    getKey:  async (req: Request, res: Response) => {
        try {
            const [mem] = await pool.query<RowDataPacket[]>('SELECT * FROM members WHERE user_id = ?', [req.user?.userId]);
            if (mem.length < 1) { 
                return homeKey.createKey(req, res);
            }

            if (mem[0].is_admin !== 1) {
                return res.status(403).json({ error: 'Only admin can get the key' });
            }
            
            const [key] = await pool.query<RowDataPacket[]>('SELECT * FROM home_keys WHERE id = ?', [mem[0].home_id]);
            const token = jwt.sign({ uuid: key[0].value }, process.env.JWT_KEY_SECRET || "JWT_KEY_SECRET");

            return res.json({ token });
        } catch (error) {
                console.error('Key generation error:', error);
                res.status(500).json({ error: 'Key generation failed' });
        }
    }
}

export default homeKey