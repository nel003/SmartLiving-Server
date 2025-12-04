"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const connection_1 = __importDefault(require("../../database/connection"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const login = async (req, res) => {
    try {
        const { usernameOrEmail, password } = req.body;
        // Validate required fields
        if (!usernameOrEmail || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }
        // Check if user exists
        const [users] = await connection_1.default.query('SELECT * FROM users WHERE username = ? || email = ?', [usernameOrEmail, usernameOrEmail]);
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        const user = users[0];
        // Compare password with hashed password in database
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        // Generate JWT token
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        // Generate refresh token
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key', { expiresIn: '7d' });
        // Store refresh token in database
        await connection_1.default.query('INSERT INTO refresh_tokens(token, user_id) VALUES(?, ?) ON DUPLICATE KEY UPDATE token = ?', [refreshToken, user.id, refreshToken]);
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
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.login = login;
