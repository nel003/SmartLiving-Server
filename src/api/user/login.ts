import { Request, Response } from 'express';
import pool from '../../database/connection';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

interface LoginRequest {
    usernameOrEmail: string;
    password: string;
}

export const login = async (req: Request, res: Response) => {
    try {
        const { usernameOrEmail, password }: LoginRequest = req.body;

        // Validate required fields
        if (!usernameOrEmail || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Check if user exists
        const [users] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM users WHERE username = ? || email = ?',
            [usernameOrEmail, usernameOrEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        const user = users[0];

        // Compare password with hashed password in database
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Generate JWT token
        const accessToken = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Generate refresh token
        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
            { expiresIn: '7d' }
        );

        // Store refresh token in database
        await pool.query(
            'INSERT INTO refresh_tokens(token, user_id) VALUES(?, ?) ON DUPLICATE KEY UPDATE token = ?',
            [refreshToken, user.id, refreshToken]
        );

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
