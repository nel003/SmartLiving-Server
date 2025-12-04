import { JsonWebTokenError } from "jsonwebtoken";
import { TokenPayload } from "./validateUser";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";
import pool from "../database/connection";

export const wsValidateUser = async (refreshToken: string, accessToken: string) => {
    try {
        if (!accessToken || !refreshToken) {
            return {
                success: false,
                message: 'Access token and refresh token are required'
            }
        }

        // Verify the access token
        let accessTokenPayload: TokenPayload;
        try {
            accessTokenPayload = jwt.verify(
                accessToken,
                process.env.JWT_SECRET || 'your-secret-key'
            ) as TokenPayload;
        } catch (error) {
            return {
                success: false,
                message: 'Invalid access token'
            }
        }

        // Verify the refresh token
        let refreshTokenPayload: TokenPayload;
        try {
            refreshTokenPayload = jwt.verify(
                refreshToken as string,
                process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
            ) as TokenPayload;
        } catch (error) {
            return {
                success: false,
                message: 'Invalid refresh token'
            }
        }

        // Verify both tokens belong to the same user
        if (accessTokenPayload.userId !== refreshTokenPayload.userId) {
            return {
                success: false,
                message: 'Token mismatch'
            }
        }

        // Check if refresh token exists in database
        const [tokens] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ?',
            [refreshToken, refreshTokenPayload.userId]
        );

        if (tokens.length === 0) {
            return {
                success: false,
                message: 'Invalid refresh token'
            }
        }

        // Get user information
        const [users] = await pool.query<RowDataPacket[]>(
            'SELECT id, username FROM users WHERE id = ?',
            [refreshTokenPayload.userId]
        );

        if (users.length === 0) {
            return {
                success: false,
                message: 'User not found'
            }
        }

        const [key] = await pool.query<RowDataPacket[]>('SELECT * FROM members WHERE user_id = ?', [refreshTokenPayload.userId]);

        // Store user in request object
        return {
            success: true,
            userId: users[0].id,
            homeId: (key.length > 0 ? key[0].home_id : -1),
            username: users[0].username,
            accessToken,
            refreshToken
        }
    } catch (error) {
        console.error("User validation error:", error);
        return {
            success: false,
            message: "Internal server error"
        }
    }
}