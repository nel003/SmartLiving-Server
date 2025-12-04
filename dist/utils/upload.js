"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfilePhotoUrl = exports.deleteProfilePhoto = exports.uploadProfilePhoto = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure uploads directory exists
const uploadsDir = path_1.default.join(__dirname, '../../uploads/profile-photos');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// Configure multer for profile photo uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: userId_timestamp.extension
        const userId = req.user?.userId || 'unknown';
        const timestamp = Date.now();
        const extension = path_1.default.extname(file.originalname);
        const filename = `${userId}_${timestamp}${extension}`;
        cb(null, filename);
    }
});
// File filter to only allow images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    }
    else {
        cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed'));
    }
};
// Configure multer
exports.uploadProfilePhoto = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: fileFilter
});
// Helper function to delete old profile photo
const deleteProfilePhoto = (filename) => {
    if (filename && filename !== 'default.png') {
        const filePath = path_1.default.join(uploadsDir, filename);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
    }
};
exports.deleteProfilePhoto = deleteProfilePhoto;
// Helper function to get profile photo URL
const getProfilePhotoUrl = (filename) => {
    if (!filename) {
        return '/uploads/profile-photos/default.png';
    }
    return `/uploads/profile-photos/${filename}`;
};
exports.getProfilePhotoUrl = getProfilePhotoUrl;
