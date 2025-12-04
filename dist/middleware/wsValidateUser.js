"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wsValidateUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connection_1 = __importDefault(require("../database/connection"));
const wsValidateUser = async (refreshToken, accessToken) => {
    try {
        if (!accessToken || !refreshToken) {
            return {
                success: false,
                message: 'Access token and refresh token are required'
            };
        }
        // Verify the access token
        let accessTokenPayload;
        try {
            accessTokenPayload = jsonwebtoken_1.default.verify(accessToken, process.env.JWT_SECRET || 'your-secret-key');
        }
        catch (error) {
            return {
                success: false,
                message: 'Invalid access token'
            };
        }
        // Verify the refresh token
        let refreshTokenPayload;
        try {
            refreshTokenPayload = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
        }
        catch (error) {
            return {
                success: false,
                message: 'Invalid refresh token'
            };
        }
        // Verify both tokens belong to the same user
        if (accessTokenPayload.userId !== refreshTokenPayload.userId) {
            return {
                success: false,
                message: 'Token mismatch'
            };
        }
        // Check if refresh token exists in database
        const [tokens] = await connection_1.default.query('SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ?', [refreshToken, refreshTokenPayload.userId]);
        if (tokens.length === 0) {
            return {
                success: false,
                message: 'Invalid refresh token'
            };
        }
        // Get user information
        const [users] = await connection_1.default.query('SELECT id, username FROM users WHERE id = ?', [refreshTokenPayload.userId]);
        if (users.length === 0) {
            return {
                success: false,
                message: 'User not found'
            };
        }
        const [key] = await connection_1.default.query('SELECT * FROM home_keys WHERE user_id = ?', [refreshTokenPayload.userId]);
        // Store user in request object
        return {
            success: true,
            userId: users[0].id,
            homeId: (key.length > 0 ? key[0].id : -1),
            username: users[0].username,
            accessToken,
            refreshToken
        };
    }
    catch (error) {
        console.error("User validation error:", error);
        return {
            success: false,
            message: "Internal server error"
        };
    }
};
exports.wsValidateUser = wsValidateUser;
