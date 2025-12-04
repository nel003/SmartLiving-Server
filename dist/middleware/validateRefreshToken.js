"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRefreshToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connection_1 = __importDefault(require("../database/connection"));
const validateRefreshToken = async (req, res, next) => {
    try {
        const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required'
            });
        }
        // Verify the refresh token
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
        // Check if refresh token exists in database
        const [tokens] = await connection_1.default.query('SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ?', [refreshToken, decoded.userId]);
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
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
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
exports.validateRefreshToken = validateRefreshToken;
