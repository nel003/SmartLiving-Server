import { Request, Response } from 'express';
import pool from '../../database/connection';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcrypt';

interface SignupRequest {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export const signup = async (req: Request, res: Response) => {
    try {
        const { username, email, password, confirmPassword }: SignupRequest = req.body;

        // Validate required fields
        if (!username || !email || !password || !confirmPassword) {
            return res.status(400).json({ 
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        // Validate password strength
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < minLength) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain uppercase, lowercase, numbers and special characters'
            });
        }

        const [existingUserUsername] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUserUsername.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            })
        }

        // Check if user already exists
        const [existingUserEmail] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUserEmail.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            })
        }
        // Hash password before storing
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await pool.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);
        
        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                username,
                email
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
