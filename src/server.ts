import express, { Request, Response } from 'express';
import { createServer, Server } from 'http';
import { WebSocket } from 'ws';
import { startWebSocketServer } from './ws/main';
import cors from 'cors';
import { startUserSocket } from './ws/user';
import { startDeviceSocket } from './ws/device';
import userRoutes from './routes/user';
import devicesRoutes from './routes/devices';
import roomsRoutes from './routes/rooms';
import homeRoutes from './routes/home';
import energyRoutes from './routes/energy';
import { healthCheck, readinessCheck, livenessCheck } from './middleware/healthCheck';
import path from 'path';
import { config } from './config/environment';
import logger from './utils/logger';

const app = express();
const port: number = config.server.port;

const wss = new WebSocket.Server({ noServer: true });

// Enhanced middleware configuration
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
    origin: config.server.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token']
}));

// Serve static files (profile photos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info('HTTP Request', {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
    });

    next();
});

// Create HTTP server
const server: Server = createServer(app);

// Create WebSocket server instance
startWebSocketServer(server, wss);
startUserSocket(wss);
startDeviceSocket(wss);

// API routes
app.use('/api/user', userRoutes);
app.use('/api/device', devicesRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/energy', energyRoutes);

// Health check endpoints
app.get('/health', healthCheck);
app.get('/ready', readinessCheck);
app.get('/live', livenessCheck);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Global error handler
app.use((error: Error, req: Request, res: Response, next: any) => {
    logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });

    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(config.server.nodeEnv === 'development' && { error: error.message })
    });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
server.listen(port, () => {
    logger.info('SmartLiving Server started', {
        port,
        environment: config.server.nodeEnv,
        version: process.env.npm_package_version || '1.0.0'
    });
    console.log(`🚀 Server is running on http://localhost:${port}`);
    console.log(`🔌 WebSocket server is running on ws://localhost:${port}`);
    console.log(`📊 Health check available at http://localhost:${port}/health`);
});