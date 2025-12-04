"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.livenessCheck = exports.readinessCheck = exports.healthCheck = void 0;
const connection_1 = require("../database/connection");
const sockets_1 = require("../utils/sockets");
const logger_1 = __importDefault(require("../utils/logger"));
const healthCheck = async (req, res) => {
    const startTime = Date.now();
    const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        services: {
            database: {
                status: 'unhealthy'
            },
            websockets: {
                status: 'healthy',
                activeConnections: {
                    users: 0,
                    devices: 0
                }
            },
            memory: {
                used: 0,
                total: 0,
                percentage: 0
            }
        }
    };
    try {
        // Check database health
        const dbStartTime = Date.now();
        const dbHealthy = await (0, connection_1.testConnection)();
        const dbResponseTime = Date.now() - dbStartTime;
        healthStatus.services.database = {
            status: dbHealthy ? 'healthy' : 'unhealthy',
            responseTime: dbResponseTime
        };
        // Check WebSocket connections
        let totalUserConnections = 0;
        let totalDeviceConnections = 0;
        // Count user connections
        sockets_1.userSockets.getHomeUsers = (homeId) => {
            // This is a simplified count - in real implementation, you'd iterate through the Map
            return new Map();
        };
        // Count device connections
        const deviceConnections = sockets_1.deviceSockets.getAll();
        deviceConnections.forEach((deviceMapForHome) => {
            deviceMapForHome.forEach((deviceConnectionsArray) => {
                totalDeviceConnections += deviceConnectionsArray.length;
            });
        });
        healthStatus.services.websockets = {
            status: totalDeviceConnections > 0 ? 'healthy' : 'degraded',
            activeConnections: {
                users: totalUserConnections,
                devices: totalDeviceConnections
            }
        };
        // Check memory usage
        const memUsage = process.memoryUsage();
        const totalMemory = memUsage.heapTotal + memUsage.external;
        const usedMemory = memUsage.heapUsed;
        const memoryPercentage = (usedMemory / totalMemory) * 100;
        healthStatus.services.memory = {
            used: Math.round(usedMemory / 1024 / 1024), // MB
            total: Math.round(totalMemory / 1024 / 1024), // MB
            percentage: Math.round(memoryPercentage)
        };
        // Determine overall status
        if (!dbHealthy) {
            healthStatus.status = 'unhealthy';
        }
        else if (totalDeviceConnections === 0 || memoryPercentage > 90) {
            healthStatus.status = 'degraded';
        }
        const responseTime = Date.now() - startTime;
        // Log health check
        logger_1.default.info('Health check performed', {
            status: healthStatus.status,
            responseTime: `${responseTime}ms`,
            database: healthStatus.services.database.status,
            websockets: healthStatus.services.websockets.status,
            memory: healthStatus.services.memory.percentage
        });
        // Return appropriate HTTP status
        const httpStatus = healthStatus.status === 'healthy' ? 200 :
            healthStatus.status === 'degraded' ? 200 : 503;
        res.status(httpStatus).json(healthStatus);
    }
    catch (error) {
        logger_1.default.error('Health check failed', {
            error: error.message,
            stack: error.stack
        });
        healthStatus.status = 'unhealthy';
        res.status(503).json(healthStatus);
    }
};
exports.healthCheck = healthCheck;
const readinessCheck = async (req, res) => {
    try {
        // Check if database is connected
        const dbHealthy = await (0, connection_1.testConnection)();
        if (!dbHealthy) {
            return res.status(503).json({
                status: 'not ready',
                reason: 'Database connection failed'
            });
        }
        res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.default.error('Readiness check failed', {
            error: error.message
        });
        res.status(503).json({
            status: 'not ready',
            reason: 'Service unavailable'
        });
    }
};
exports.readinessCheck = readinessCheck;
const livenessCheck = (req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
};
exports.livenessCheck = livenessCheck;
