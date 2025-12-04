"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isConnected = exports.testConnection = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const environment_1 = require("../config/environment");
// Database connection configuration with enhanced settings
const dbConfig = {
    host: environment_1.config.database.host,
    user: environment_1.config.database.user,
    password: environment_1.config.database.password,
    database: environment_1.config.database.database,
    port: environment_1.config.database.port,
    waitForConnections: true,
    connectionLimit: 20, // Increased for better performance
    queueLimit: 0,
    acquireTimeout: 60000, // 60 seconds
    timeout: 60000, // 60 seconds
    reconnect: true,
    charset: 'utf8mb4',
    timezone: 'Z',
    // Connection pool settings
    idleTimeout: 300000, // 5 minutes
    maxIdle: 10, // Maximum idle connections
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};
// Create a connection pool with enhanced configuration
const pool = promise_1.default.createPool(dbConfig);
// Connection health check
let isConnected = false;
exports.isConnected = isConnected;
let connectionRetries = 0;
const maxRetries = 5;
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        exports.isConnected = isConnected = true;
        connectionRetries = 0;
        console.log('✅ Database connected successfully');
        return true;
    }
    catch (err) {
        exports.isConnected = isConnected = false;
        connectionRetries++;
        console.error(`❌ Database connection failed (attempt ${connectionRetries}/${maxRetries}):`, err);
        if (connectionRetries >= maxRetries) {
            console.error('🚨 Maximum database connection retries reached. Application may not function properly.');
        }
        return false;
    }
};
exports.testConnection = testConnection;
// Initial connection test
testConnection();
// Periodic health check every 30 seconds
setInterval(async () => {
    if (!isConnected) {
        await testConnection();
    }
}, 30000);
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🔄 Closing database connections...');
    await pool.end();
    console.log('✅ Database connections closed');
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('🔄 Closing database connections...');
    await pool.end();
    console.log('✅ Database connections closed');
    process.exit(0);
});
// Export the pool and health check function
exports.default = pool;
