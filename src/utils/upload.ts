import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/profile-photos');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for profile photo uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: userId_timestamp.extension
        const userId = req.user?.userId || 'unknown';
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        const filename = `${userId}_${timestamp}${extension}`;
        cb(null, filename);
    }
});

// File filter to only allow images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed'));
    }
};

// Configure multer
export const uploadProfilePhoto = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: fileFilter
});

// Helper function to delete old profile photo
export const deleteProfilePhoto = (filename: string) => {
    if (filename && filename !== 'default.png') {
        const filePath = path.join(uploadsDir, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
};

// Helper function to get profile photo URL
export const getProfilePhotoUrl = (filename: string | null) => {
    if (!filename) {
        return '/uploads/profile-photos/default.png';
    }
    return `/uploads/profile-photos/${filename}`;
};
