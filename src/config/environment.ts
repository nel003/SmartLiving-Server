import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface EnvironmentConfig {
  // Database
  database: {
    host: string;
    user: string;
    password: string;
    database: string;
    port: number;
  };
  
  // JWT
  jwt: {
    secret: string;
    refreshSecret: string;
    keySecret: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
  };
  
  // Server
  server: {
    port: number;
    nodeEnv: string;
    corsOrigin: string[];
  };
  
  // Firebase
  firebase: {
    projectId: string;
    privateKeyId: string;
    privateKey: string;
    clientEmail: string;
    clientId: string;
    authUri: string;
    tokenUri: string;
  };
  
  // Logging
  logging: {
    level: string;
    file: string;
  };
  
  // Rate Limiting
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

const requiredEnvVars = [
  'DB_HOST',
  'DB_USER', 
  'DB_NAME',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_KEY_SECRET'
];

// Validate required environment variables
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

export const config: EnvironmentConfig = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', // Allow empty password
    database: process.env.DB_NAME || 'smartliving',
    port: parseInt(process.env.DB_PORT || '3306'),
  },
  
  jwt: {
    secret: process.env.JWT_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    keySecret: process.env.JWT_KEY_SECRET!,
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '24h',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  
  server: {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  },
  
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    clientId: process.env.FIREBASE_CLIENT_ID || '',
    authUri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
    tokenUri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
};

export default config;
