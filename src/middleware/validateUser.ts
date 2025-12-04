
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../database/connection';
import { RowDataPacket } from 'mysql2';

export interface TokenPayload {
    userId: number;
    username?: string;
}

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: number;
                username: string;
                accessToken: string;
                refreshToken: string;
            };
        }
    }
}

export const validateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const accessToken = req.headers.authorization?.split(' ')[1];
        const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];

        if (!accessToken || !refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Access token and refresh token are required'
            });
        }

        // Verify the access token
        let accessTokenPayload: TokenPayload;
        try {
            accessTokenPayload = jwt.verify(
                accessToken,
                process.env.JWT_SECRET || 'your-secret-key'
            ) as TokenPayload;
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid access token'
            });
        }

        // Verify the refresh token
        let refreshTokenPayload: TokenPayload;
        try {
            refreshTokenPayload = jwt.verify(
                refreshToken as string,
                process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
            ) as TokenPayload;
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Verify both tokens belong to the same user
        if (accessTokenPayload.userId !== refreshTokenPayload.userId) {
            return res.status(401).json({
                success: false,
                message: 'Token mismatch'
            });
        }

        // Check if refresh token exists in database
        const [tokens] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ?',
            [refreshToken, refreshTokenPayload.userId]
        );

        if (tokens.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Get user information
        const [users] = await pool.query<RowDataPacket[]>(
            'SELECT id, username FROM users WHERE id = ?',
            [refreshTokenPayload.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Store user in request object
        req.user = {
            userId: users[0].id,
            username: users[0].username,
            accessToken,
            refreshToken
        };

        console.log('User validated successfully:', {
            userId: req.user.userId,
            username: req.user.username,
            accessToken: accessToken?.substring(0, 20) + '...',
            refreshToken: refreshToken?.substring(0, 20) + '...'
        });

        next();

    } catch (error) {
        console.error('Token validation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

