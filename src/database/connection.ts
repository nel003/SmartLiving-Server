import mysql from 'mysql2/promise';
import { config } from '../config/environment';

// Database connection configuration with enhanced settings
const dbConfig = {
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    port: config.database.port,
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
const pool = mysql.createPool(dbConfig);

// Connection health check
let isConnected = false;
let connectionRetries = 0;
const maxRetries = 5;

const testConnection = async (): Promise<boolean> => {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        isConnected = true;
        connectionRetries = 0;
        console.log('✅ Database connected successfully');
        return true;
    } catch (err) {
        isConnected = false;
        connectionRetries++;
        console.error(`❌ Database connection failed (attempt ${connectionRetries}/${maxRetries}):`, err);
        
        if (connectionRetries >= maxRetries) {
            console.error('🚨 Maximum database connection retries reached. Application may not function properly.');
        }
        return false;
    }
};

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
export default pool;
export { testConnection, isConnected };
