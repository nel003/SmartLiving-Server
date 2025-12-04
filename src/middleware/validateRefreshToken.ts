
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../database/connection';
import { RowDataPacket } from 'mysql2';

interface TokenPayload {
    userId: number;
    refreshToken: string;
}

export const validateRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify the refresh token
        const decoded = jwt.verify(
            refreshToken as string,
            process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
        ) as TokenPayload;

        // Check if refresh token exists in database
        const [tokens] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ?',
            [refreshToken, decoded.userId]
        );

        if (tokens.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Attach user ID to request for later use
        req.body.userId = decoded.userId;
        req.body.refreshToken = refreshToken;
        next();

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        console.error('Refresh token validation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
