"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const ws_1 = require("ws");
const main_1 = require("./ws/main");
const cors_1 = __importDefault(require("cors"));
const user_1 = require("./ws/user");
const device_1 = require("./ws/device");
const user_2 = __importDefault(require("./routes/user"));
const devices_1 = __importDefault(require("./routes/devices"));
const rooms_1 = __importDefault(require("./routes/rooms"));
const healthCheck_1 = require("./middleware/healthCheck");
const path_1 = __importDefault(require("path"));
const environment_1 = require("./config/environment");
const logger_1 = __importDefault(require("./utils/logger"));
const app = (0, express_1.default)();
const port = environment_1.config.server.port;
const wss = new ws_1.WebSocket.Server({ noServer: true });
// Enhanced middleware configuration
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// CORS configuration
app.use((0, cors_1.default)({
    origin: environment_1.config.server.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token']
}));
// Serve static files (profile photos)
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Request logging middleware
app.use((req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger_1.default.info('HTTP Request', {
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
const server = (0, http_1.createServer)(app);
// Create WebSocket server instance
(0, main_1.startWebSocketServer)(server, wss);
(0, user_1.startUserSocket)(wss);
(0, device_1.startDeviceSocket)(wss);
// API routes
app.use('/api/user', user_2.default);
app.use('/api/device', devices_1.default);
app.use('/api/rooms', rooms_1.default);
// Health check endpoints
app.get('/health', healthCheck_1.healthCheck);
app.get('/ready', healthCheck_1.readinessCheck);
app.get('/live', healthCheck_1.livenessCheck);
// Static files
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
// Global error handler
app.use((error, req, res, next) => {
    logger_1.default.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(environment_1.config.server.nodeEnv === 'development' && { error: error.message })
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});
// Graceful shutdown
const gracefulShutdown = (signal) => {
    logger_1.default.info(`Received ${signal}. Starting graceful shutdown...`);
    server.close(() => {
        logger_1.default.info('HTTP server closed');
        process.exit(0);
    });
    // Force close after 10 seconds
    setTimeout(() => {
        logger_1.default.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// Start the server
server.listen(port, () => {
    logger_1.default.info('SmartLiving Server started', {
        port,
        environment: environment_1.config.server.nodeEnv,
        version: process.env.npm_package_version || '1.0.0'
    });
    console.log(`🚀 Server is running on http://localhost:${port}`);
    console.log(`🔌 WebSocket server is running on ws://localhost:${port}`);
    console.log(`📊 Health check available at http://localhost:${port}/health`);
});
