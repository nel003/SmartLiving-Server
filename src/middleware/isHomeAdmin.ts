
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../database/connection';
import { RowDataPacket } from 'mysql2';

export interface TokenPayload {
    userId: number;
    username?: string;
}


export const isHomeAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user;

        const [userFromDB] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM members WHERE user_id = ?',
            [user?.userId]
        );

        if (userFromDB.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'No user found'
            });
        }
        if (userFromDB[0].is_admin !== 1) {
            return res.status(403).json({
                success: false,
                message: 'User is not an admin'
            });
        }
        next();

    } catch (error) {
        console.error('Token validation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

