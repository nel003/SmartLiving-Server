import { Request, Response } from 'express';
import pool from '../../database/connection';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const pushToken = {
    upsertToken: async (req: Request, res: Response) => {
        try {
            const { token } = req.body;
            const userId = req.user?.userId;
            
            // Validate required fields
            if (!token || !userId) {
                return res.status(400).json({ 
                    message: 'Token is required and user must be authenticated' 
                });
            }

            // Check if token already exists for this user
            const [existingToken] = await pool.query<RowDataPacket[]>(
                "SELECT id FROM push_notif_token WHERE user_id = ? AND token = ?",
                [userId, token]
            );

            if (existingToken.length > 0) {
                // Token already exists, update the timestamp
                await pool.query<ResultSetHeader>(
                    "UPDATE push_notif_token SET updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND token = ?",
                    [userId, token]
                );

                return res.status(200).json({ 
                    message: 'Push notification token updated successfully',
                    tokenId: existingToken[0].id
                });
            } else {
                // Insert new token
                const [result] = await pool.query<ResultSetHeader>(
                    "INSERT INTO push_notif_token (token, user_id) VALUES (?, ?)",
                    [token, userId]
                );

                return res.status(201).json({ 
                    message: 'Push notification token added successfully',
                    tokenId: result.insertId
                });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error managing push notification token', error: errorMessage });
            console.log(error);
        }
    },

    getUserTokens: async (req: Request, res: Response) => {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                return res.status(400).json({ message: 'User must be authenticated' });
            }

            // Get all tokens for the user
            const [tokens] = await pool.query<RowDataPacket[]>(
                `SELECT 
                    id,
                    token,
                    created_at,
                    updated_at
                FROM push_notif_token 
                WHERE user_id = ?
                ORDER BY updated_at DESC`,
                [userId]
            );

            res.status(200).json({ 
                success: true,
                tokens: tokens
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error fetching push notification tokens', error: errorMessage });
            console.log(error);
        }
    },

    deleteToken: async (req: Request, res: Response) => {
        try {
            const { tokenId } = req.params;
            const userId = req.user?.userId;

            if (!tokenId || !userId) {
                return res.status(400).json({ message: 'Token ID is required and user must be authenticated' });
            }

            // Delete the token (only if it belongs to the authenticated user)
            const [result] = await pool.query<ResultSetHeader>(
                "DELETE FROM push_notif_token WHERE id = ? AND user_id = ?",
                [tokenId, userId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Push notification token not found or not authorized' });
            }

            res.status(200).json({ message: 'Push notification token deleted successfully' });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error deleting push notification token', error: errorMessage });
            console.log(error);
        }
    },

    deleteTokenByValue: async (req: Request, res: Response) => {
        try {
            const { token } = req.body;
            const userId = req.user?.userId;

            if (!token || !userId) {
                return res.status(400).json({ message: 'Token is required and user must be authenticated' });
            }

            // Delete the token by value (only if it belongs to the authenticated user)
            const [result] = await pool.query<ResultSetHeader>(
                "DELETE FROM push_notif_token WHERE token = ? AND user_id = ?",
                [token, userId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Push notification token not found or not authorized' });
            }

            res.status(200).json({ message: 'Push notification token deleted successfully' });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            res.status(500).json({ message: 'Error deleting push notification token', error: errorMessage });
            console.log(error);
        }
    }
}
