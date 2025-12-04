import { RowDataPacket } from "mysql2";
import pool from "../database/connection";
import { Request, Response } from 'express';

export const home = {
    members: async (req: Request, res: Response) => {
        try {
            const [data] = await pool.query<RowDataPacket[]>(
                `SELECT
                    m.id AS id,
                    u.id AS user_id,
                    u.username AS username,
                    u.avatar AS avatar,
                    m.is_admin AS is_admin
                FROM
                    users AS u
                JOIN
                    members AS m ON u.id = m.user_id
                WHERE
                    m.home_id = (SELECT home_id FROM members WHERE user_id = ?);`,[req.user?.userId]
            );
            return res.status(200).json({
                success: true,
                im_admin: data.find(member => member.user_id === req.user?.userId)?.is_admin === 1,
                members: data
            });
        } catch (error) {
            console.error('Error fetching home members:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },
    invite: async (req: Request, res: Response) => {
        try {
            const inviterId = req.user?.userId;
            if (!inviterId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }

            // verify inviter is member and admin of a home
            const [memberRows] = await pool.query<RowDataPacket[]>(
                'SELECT home_id, is_admin FROM members WHERE user_id = ?',
                [inviterId]
            );
            const member = memberRows[0];
            if (!member) {
                return res.status(404).json({ success: false, message: 'Member not found' });
            }
            if (member.is_admin !== 1) {
                return res.status(403).json({ success: false, message: 'Only admins can create invites' });
            }

            // generate a secure token and store an invite that expires in 5 minutes
            const { randomBytes } = await import('crypto');
            const token = randomBytes(32).toString('hex');

            await pool.query(
                'INSERT INTO invitations (home_id, token, expires_at, created_by) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE), ?)',
                [member.home_id, token, inviterId]
            );

            // build a one-time invite link
            const host = req.get('host') || 'localhost';
            const link = `${req.protocol}://${host}/invite.html?token=${token}`;

            return res.status(201).json({
                success: true,
                link,
                expires_in_seconds: 5 * 60
            });
        } catch (error) {
            console.log('Error creating invitation:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },
    acceptInvite: async (req: Request, res: Response) => {
        try {
            const { token } = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            // validate the invite token
            const [inviteRows] = await pool.query<RowDataPacket[]>(
                'SELECT home_id, expires_at FROM invitations WHERE token = ?',
                [token]
            );
            const invite = inviteRows[0];
            if (!invite) {
                return res.status(404).json({ success: false, message: 'Invalid invitation token' });
            }
            const now = new Date();
            if (now > new Date(invite.expires_at)) {
                return res.status(400).json({ success: false, message: 'Invitation token has expired' });
            }

            // check if user is already a member of a home
            const [memberRows] = await pool.query<RowDataPacket[]>(
                'SELECT home_id FROM members WHERE user_id = ?',
                [userId]
            );
            if (memberRows.length > 0) {
                return res.status(400).json({ success: false, message: 'User is already a member of a home' });
            }

            // add the user to the home as a non-admin member
            await pool.query(
                'INSERT INTO members (home_id, user_id, is_admin) VALUES (?, ?, 0)',
                [invite.home_id, userId]
            );
            return res.status(200).json({
                success: true,
                message: 'Successfully joined the home'
            });
        } catch (error) {
            console.log('Error accepting invitation:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },
    deleteMember: async (req: Request, res: Response) => {
        try {
            const { memberId } = req.params;

            if (!memberId) {
                return res.status(401).json({ success: false, message: 'Member id required!' });
            }

            // verify requester is member and admin of a home
            const [requesterRows] = await pool.query<RowDataPacket[]>(
                'SELECT home_id, is_admin FROM members WHERE user_id = ?',
                [req.user?.userId]
            );
            const requester = requesterRows[0];     
            if (!requester) {
                return res.status(404).json({ success: false, message: 'Requester not found' });
            }
            if (requester.is_admin !== 1) {
                return res.status(403).json({ success: false, message: 'Only admins can delete members' });
            }

            // delete the member
            const [deleteResult] = await pool.query(
                'DELETE FROM members WHERE id = ? AND home_id = ?',
                [memberId, requester.home_id]
            );
            if ((deleteResult as any).affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Member not found in your home' });
            }
            return res.status(200).json({
                success: true,
                message: 'Member deleted successfully'
            });
        } catch (error) {
            console.log('Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}