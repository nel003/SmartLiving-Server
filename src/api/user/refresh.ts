
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../../database/connection';
import { RowDataPacket } from 'mysql2';

export const refresh = async (req: Request, res: Response) => {
    try {
        const userId = req.body.userId; // Set by validateRefreshToken middleware

        // Get user information
        const [users] = await pool.query<RowDataPacket[]>(
            'SELECT id, username, email, avatar FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        // Generate new access token
        const accessToken = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        return res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                accessToken,
                refreshToken: req.body?.refreshToken
            }
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
