import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config/environment';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.dirname(config.logging.file);
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        if (stack) {
            log += `\n${stack}`;
        }
        
        if (Object.keys(meta).length > 0) {
            log += `\n${JSON.stringify(meta, null, 2)}`;
        }
        
        return log;
    })
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        let log = `${timestamp} ${level}: ${message}`;
        if (stack) {
            log += `\n${stack}`;
        }
        return log;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    defaultMeta: { service: 'smartliving-server' },
    transports: [
        // File transport for all logs
        new DailyRotateFile({
            filename: path.join(logsDir, 'app-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true
        }),
        
        // Separate file for error logs
        new DailyRotateFile({
            filename: path.join(logsDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '30d',
            zippedArchive: true
        }),
        
        // Separate file for WebSocket logs
        new DailyRotateFile({
            filename: path.join(logsDir, 'websocket-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '7d',
            zippedArchive: true,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    ],
    
    // Handle uncaught exceptions
    exceptionHandlers: [
        new winston.transports.File({ 
            filename: path.join(logsDir, 'exceptions.log') 
        })
    ],
    
    // Handle unhandled promise rejections
    rejectionHandlers: [
        new winston.transports.File({ 
            filename: path.join(logsDir, 'rejections.log') 
        })
    ]
});

// Add console transport for development
if (config.server.nodeEnv !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// Custom logging methods for different contexts
export const loggerUtils = {
    // Database operations
    db: {
        query: (query: string, params?: any[], duration?: number) => {
            logger.info('Database query executed', {
                query: query.replace(/\s+/g, ' ').trim(),
                params: params?.length ? params : undefined,
                duration: duration ? `${duration}ms` : undefined
            });
        },
        
        error: (error: Error, query?: string, params?: any[]) => {
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
        connection: (type: 'user' | 'device', id: string, homeId?: string) => {
            logger.info('WebSocket connection established', {
                type,
                id,
                homeId,
                timestamp: new Date().toISOString()
            });
        },
        
        disconnection: (type: 'user' | 'device', id: string, homeId?: string) => {
            logger.info('WebSocket connection closed', {
                type,
                id,
                homeId,
                timestamp: new Date().toISOString()
            });
        },
        
        message: (type: 'user' | 'device', id: string, message: any, homeId?: string) => {
            logger.info('WebSocket message received', {
                type,
                id,
                homeId,
                messageType: message.type,
                messageSize: JSON.stringify(message).length,
                timestamp: new Date().toISOString()
            });
        },
        
        error: (type: 'user' | 'device', id: string, error: Error, homeId?: string) => {
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
        login: (username: string, success: boolean, ip?: string) => {
            logger.info('User login attempt', {
                username,
                success,
                ip,
                timestamp: new Date().toISOString()
            });
        },
        
        tokenRefresh: (userId: number, success: boolean) => {
            logger.info('Token refresh attempt', {
                userId,
                success,
                timestamp: new Date().toISOString()
            });
        },
        
        unauthorized: (reason: string, ip?: string) => {
            logger.warn('Unauthorized access attempt', {
                reason,
                ip,
                timestamp: new Date().toISOString()
            });
        }
    },
    
    // Device operations
    device: {
        toggle: (deviceId: number, pin: number, value: boolean, userId: number) => {
            logger.info('Device toggle', {
                deviceId,
                pin,
                value,
                userId,
                timestamp: new Date().toISOString()
            });
        },
        
        motion: (deviceId: number, homeId: number) => {
            logger.info('Motion detected', {
                deviceId,
                homeId,
                timestamp: new Date().toISOString()
            });
        }
    },
    
    // Push notifications
    push: {
        sent: (token: string, title: string, success: boolean) => {
            logger.info('Push notification sent', {
                token: token.substring(0, 20) + '...', // Truncate for privacy
                title,
                success,
                timestamp: new Date().toISOString()
            });
        },
        
        error: (token: string, error: Error) => {
            logger.error('Push notification error', {
                token: token.substring(0, 20) + '...', // Truncate for privacy
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        }
    }
};

export default logger;
