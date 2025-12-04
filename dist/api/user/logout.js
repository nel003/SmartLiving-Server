"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = void 0;
const connection_1 = __importDefault(require("../../database/connection"));
const logout = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        // Delete refresh token from database
        await connection_1.default.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.logout = logout;
