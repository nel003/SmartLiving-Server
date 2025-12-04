
import { Request, Response } from 'express';
import pool from '../../database/connection';

export const logout = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Delete refresh token from database
        await pool.query(
            'DELETE FROM refresh_tokens WHERE user_id = ?',
            [userId]
        );

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
