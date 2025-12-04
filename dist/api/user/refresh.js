"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refresh = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connection_1 = __importDefault(require("../../database/connection"));
const refresh = async (req, res) => {
    try {
        const userId = req.body.userId; // Set by validateRefreshToken middleware
        // Get user information
        const [users] = await connection_1.default.query('SELECT id, username, email, avatar FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }
        const user = users[0];
        // Generate new access token
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
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
    }
    catch (error) {
        console.error('Token refresh error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.refresh = refresh;
