"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerUtils = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const environment_1 = require("../config/environment");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure logs directory exists
const logsDir = path_1.default.dirname(environment_1.config.logging.file);
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
// Custom log format
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
}), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (stack) {
        log += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
        log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
}));
// Console format for development
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({
    format: 'HH:mm:ss'
}), winston_1.default.format.printf(({ timestamp, level, message, stack }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (stack) {
        log += `\n${stack}`;
    }
    return log;
}));
// Create logger instance
const logger = winston_1.default.createLogger({
    level: environment_1.config.logging.level,
    format: logFormat,
    defaultMeta: { service: 'smartliving-server' },
    transports: [
        // File transport for all logs
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(logsDir, 'app-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true
        }),
        // Separate file for error logs
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(logsDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '30d',
            zippedArchive: true
        }),
        // Separate file for WebSocket logs
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(logsDir, 'websocket-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '7d',
            zippedArchive: true,
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json())
        })
    ],
    // Handle uncaught exceptions
    exceptionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'exceptions.log')
        })
    ],
    // Handle unhandled promise rejections
    rejectionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'rejections.log')
        })
    ]
});
// Add console transport for development
if (environment_1.config.server.nodeEnv !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: consoleFormat
    }));
}
// Custom logging methods for different contexts
exports.loggerUtils = {
    // Database operations
    db: {
        query: (query, params, duration) => {
            logger.info('Database query executed', {
                query: query.replace(/\s+/g, ' ').trim(),
                params: params?.length ? params : undefined,
                duration: duration ? `${duration}ms` : undefined
            });
        },
        error: (error, query, params) => {
            logger.error('Database error', {
                error: error.message,
                stack: error.stack,
                query: query?.replace(/\s+/g, ' ').trim(),
                params: params?.length ? params : undefined
            });
        }
    },
    // WebSocket operations
    ws: {
        connection: (type, id, homeId) => {
            logger.info('WebSocket connection established', {
                type,
                id,
                homeId,
                timestamp: new Date().toISOString()
            });
        },
        disconnection: (type, id, homeId) => {
            logger.info('WebSocket connection closed', {
                type,
                id,
                homeId,
                timestamp: new Date().toISOString()
            });
        },
        message: (type, id, message, homeId) => {
            logger.info('WebSocket message received', {
                type,
                id,
                homeId,
                messageType: message.type,
                messageSize: JSON.stringify(message).length,
                timestamp: new Date().toISOString()
            });
        },
        error: (type, id, error, homeId) => {
            logger.error('WebSocket error', {
                type,
                id,
                homeId,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        }
    },
    // Authentication operations
    auth: {
        login: (username, success, ip) => {
            logger.info('User login attempt', {
                username,
                success,
                ip,
                timestamp: new Date().toISOString()
            });
        },
        tokenRefresh: (userId, success) => {
            logger.info('Token refresh attempt', {
                userId,
                success,
                timestamp: new Date().toISOString()
            });
        },
        unauthorized: (reason, ip) => {
            logger.warn('Unauthorized access attempt', {
                reason,
                ip,
                timestamp: new Date().toISOString()
            });
        }
    },
    // Device operations
    device: {
        toggle: (deviceId, pin, value, userId) => {
            logger.info('Device toggle', {
                deviceId,
                pin,
                value,
                userId,
                timestamp: new Date().toISOString()
            });
        },
        motion: (deviceId, homeId) => {
            logger.info('Motion detected', {
                deviceId,
                homeId,
                timestamp: new Date().toISOString()
            });
        }
    },
    // Push notifications
    push: {
        sent: (token, title, success) => {
            logger.info('Push notification sent', {
                token: token.substring(0, 20) + '...', // Truncate for privacy
                title,
                success,
                timestamp: new Date().toISOString()
            });
        },
        error: (token, error) => {
            logger.error('Push notification error', {
                token: token.substring(0, 20) + '...', // Truncate for privacy
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        }
    }
};
exports.default = logger;
