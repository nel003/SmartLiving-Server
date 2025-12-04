"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = __importDefault(require("../../database/connection"));
const logger_1 = require("../../utils/logger");
const upload_1 = require("../../utils/upload");
exports.default = {
    update: async (req, res) => {
        try {
            console.log('Profile update request received:', {
                user: req.user,
                body: req.body,
                headers: {
                    authorization: req.headers.authorization?.substring(0, 20) + '...',
                    'x-refresh-token': Array.isArray(req.headers['x-refresh-token']) ? req.headers['x-refresh-token'][0]?.substring(0, 20) + '...' : req.headers['x-refresh-token']?.substring(0, 20) + '...'
                }
            });
            const userId = req.user?.userId;
            const { username, email } = req.body;
            if (!userId) {
                console.log('No userId found in request.user:', req.user);
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }
            // Check if username already exists (excluding current user)
            const [existingUsername] = await connection_1.default.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
            if (Array.isArray(existingUsername) && existingUsername.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already taken'
                });
            }
            // Check if email already exists (excluding current user)
            const [existingEmail] = await connection_1.default.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
            if (Array.isArray(existingEmail) && existingEmail.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use'
                });
            }
            // Update user profile
            const [result] = await connection_1.default.query('UPDATE users SET username = ?, email = ? WHERE id = ?', [username, email, userId]);
            logger_1.loggerUtils.db.query(`Profile updated for user ${userId}: username=${username}, email=${email}`);
            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    username,
                    email
                }
            });
        }
        catch (error) {
            logger_1.loggerUtils.db.error(error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },
    get: async (req, res) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }
            // Get user profile
            const [users] = await connection_1.default.query('SELECT id, username, email, avatar, created_at FROM users WHERE id = ?', [userId]);
            if (Array.isArray(users) && users.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            const user = Array.isArray(users) ? users[0] : users;
            res.json({
                success: true,
                data: user
            });
        }
        catch (error) {
            logger_1.loggerUtils.db.error(error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },
    uploadPhoto: async (req, res) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }
            // Get current profile photo to delete it later
            const [currentUser] = await connection_1.default.query('SELECT avatar FROM users WHERE id = ?', [userId]);
            const currentPhoto = Array.isArray(currentUser) ? currentUser[0]?.avatar : currentUser?.avatar;
            // Update user profile with new photo filename
            const [result] = await connection_1.default.query('UPDATE users SET avatar = ? WHERE id = ?', [req.file.filename, userId]);
            // Delete old profile photo if it exists
            if (currentPhoto) {
                (0, upload_1.deleteProfilePhoto)(currentPhoto);
            }
            logger_1.loggerUtils.db.query(`Profile photo updated for user ${userId}: ${req.file.filename}`);
            res.json({
                success: true,
                message: 'Profile photo updated successfully',
                data: {
                    filename: req.file.filename,
                    url: (0, upload_1.getProfilePhotoUrl)(req.file.filename)
                }
            });
        }
        catch (error) {
            logger_1.loggerUtils.db.error(error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },
    deletePhoto: async (req, res) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }
            // Get current profile photo
            const [currentUser] = await connection_1.default.query('SELECT avatar FROM users WHERE id = ?', [userId]);
            const currentPhoto = Array.isArray(currentUser) ? currentUser[0]?.avatar : currentUser?.avatar;
            if (!currentPhoto) {
                return res.status(400).json({
                    success: false,
                    message: 'No profile photo to delete'
                });
            }
            // Remove profile photo from database
            const [result] = await connection_1.default.query('UPDATE users SET avatar = NULL WHERE id = ?', [userId]);
            // Delete the file
            (0, upload_1.deleteProfilePhoto)(currentPhoto);
            logger_1.loggerUtils.db.query(`Profile photo deleted for user ${userId}`);
            res.json({
                success: true,
                message: 'Profile photo deleted successfully'
            });
        }
        catch (error) {
            logger_1.loggerUtils.db.error(error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
};
