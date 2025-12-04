"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connection_1 = __importDefault(require("../database/connection"));
const validateUser = async (req, res, next) => {
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
        let accessTokenPayload;
        try {
            accessTokenPayload = jsonwebtoken_1.default.verify(accessToken, process.env.JWT_SECRET || 'your-secret-key');
        }
        catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid access token'
            });
        }
        // Verify the refresh token
        let refreshTokenPayload;
        try {
            refreshTokenPayload = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
        }
        catch (error) {
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
        const [tokens] = await connection_1.default.query('SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ?', [refreshToken, refreshTokenPayload.userId]);
        if (tokens.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
        // Get user information
        const [users] = await connection_1.default.query('SELECT id, username FROM users WHERE id = ?', [refreshTokenPayload.userId]);
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
    }
    catch (error) {
        console.error('Token validation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.validateUser = validateUser;
