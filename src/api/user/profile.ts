import { Request, Response } from 'express';
import pool from '../../database/connection';
import { loggerUtils } from '../../utils/logger';
import { deleteProfilePhoto, getProfilePhotoUrl } from '../../utils/upload';

export default {
    update: async (req: Request, res: Response) => {
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
            const [existingUsername] = await pool.query(
                'SELECT id FROM users WHERE username = ? AND id != ?',
                [username, userId]
            );

            if (Array.isArray(existingUsername) && existingUsername.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already taken'
                });
            }

            // Check if email already exists (excluding current user)
            const [existingEmail] = await pool.query(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, userId]
            );

            if (Array.isArray(existingEmail) && existingEmail.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use'
                });
            }

            // Update user profile
            const [result] = await pool.query(
                'UPDATE users SET username = ?, email = ? WHERE id = ?',
                [username, email, userId]
            );

            loggerUtils.db.query(`Profile updated for user ${userId}: username=${username}, email=${email}`);

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    username,
                    email
                }
            });

        } catch (error) {
            loggerUtils.db.error(error as Error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    get: async (req: Request, res: Response) => {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'User not authenticated' 
                });
            }

            // Get user profile
            const [users] = await pool.query(
                'SELECT id, username, email, avatar, created_at FROM users WHERE id = ?',
                [userId]
            );

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

        } catch (error) {
            loggerUtils.db.error(error as Error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    uploadPhoto: async (req: Request, res: Response) => {
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
            const [currentUser] = await pool.query(
                'SELECT avatar FROM users WHERE id = ?',
                [userId]
            );

            const currentPhoto = Array.isArray(currentUser) ? (currentUser[0] as any)?.avatar : (currentUser as any)?.avatar;

            // Update user profile with new photo filename
            const [result] = await pool.query(
                'UPDATE users SET avatar = ? WHERE id = ?',
                [req.file.filename, userId]
            );

            // Delete old profile photo if it exists
            if (currentPhoto) {
                deleteProfilePhoto(currentPhoto);
            }

            loggerUtils.db.query(`Profile photo updated for user ${userId}: ${req.file.filename}`);

            res.json({
                success: true,
                message: 'Profile photo updated successfully',
                data: {
                    filename: req.file.filename,
                    url: getProfilePhotoUrl(req.file.filename)
                }
            });

        } catch (error) {
            loggerUtils.db.error(error as Error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    deletePhoto: async (req: Request, res: Response) => {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'User not authenticated' 
                });
            }

            // Get current profile photo
            const [currentUser] = await pool.query(
                'SELECT avatar FROM users WHERE id = ?',
                [userId]
            );

            const currentPhoto = Array.isArray(currentUser) ? (currentUser[0] as any)?.avatar : (currentUser as any)?.avatar;

            if (!currentPhoto) {
                return res.status(400).json({
                    success: false,
                    message: 'No profile photo to delete'
                });
            }

            // Remove profile photo from database
            const [result] = await pool.query(
                'UPDATE users SET avatar = NULL WHERE id = ?',
                [userId]
            );

            // Delete the file
            deleteProfilePhoto(currentPhoto);

            loggerUtils.db.query(`Profile photo deleted for user ${userId}`);

            res.json({
                success: true,
                message: 'Profile photo deleted successfully'
            });

        } catch (error) {
            loggerUtils.db.error(error as Error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
};
