# SmartLiving Server Setup Guide

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env` file in the server root directory:

```bash
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smartliving

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_KEY_SECRET=your-device-key-secret-change-this-in-production

# Server Configuration
PORT=3000
NODE_ENV=development

# Firebase Configuration (for push notifications)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:19006

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Database Setup

1. Create MySQL database:
```sql
CREATE DATABASE smartliving;
```

2. Run the database indexes script:
```bash
mysql -u root -p smartliving < database_indexes.sql
```

3. Ensure all required tables exist (users, home_keys, rooms, devices, etc.)

### 3. Install Dependencies

```bash
npm install
```

### 4. Build and Start

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 🔧 New Features Added

### 1. Environment Configuration
- Centralized configuration management
- Environment-specific settings
- Validation of required environment variables

### 2. Structured Logging
- Winston-based logging with daily rotation
- Separate log files for different components
- Performance and error tracking
- WebSocket connection logging

### 3. Input Validation
- Joi-based validation schemas
- Comprehensive validation for all endpoints
- WebSocket message validation
- Sanitization and error handling

### 4. Database Optimization
- Connection pooling with enhanced settings
- Health checks and automatic reconnection
- Performance monitoring
- Graceful shutdown handling

### 5. WebSocket Enhancements
- Message validation
- Error recovery and logging
- Connection health monitoring
- Improved error handling

### 6. Health Monitoring
- `/health` - Comprehensive health check
- `/ready` - Readiness probe
- `/live` - Liveness probe
- Performance metrics

### 7. Security Improvements
- Enhanced CORS configuration
- Request logging and monitoring
- Global error handling
- Input sanitization

## 📊 Monitoring Endpoints

- **Health Check**: `GET /health`
- **Readiness**: `GET /ready`
- **Liveness**: `GET /live`

## 🗂️ Log Files

Logs are stored in the `logs/` directory:
- `app-YYYY-MM-DD.log` - General application logs
- `error-YYYY-MM-DD.log` - Error logs only
- `websocket-YYYY-MM-DD.log` - WebSocket specific logs
- `exceptions.log` - Uncaught exceptions
- `rejections.log` - Unhandled promise rejections

## 🔍 Performance Monitoring

The server now includes:
- Database query performance tracking
- WebSocket message processing metrics
- Memory usage monitoring
- Connection health checks

## 🛡️ Security Features

- Input validation on all endpoints
- SQL injection protection
- CORS configuration
- Request rate limiting (configurable)
- Secure token handling

## 🚨 Error Handling

- Structured error responses
- Comprehensive logging
- Graceful degradation
- Automatic reconnection for WebSockets

## 📈 Performance Optimizations

- Database connection pooling
- Query optimization with indexes
- Efficient WebSocket message handling
- Memory management improvements

## 🔄 Deployment

### Production Checklist

1. ✅ Set `NODE_ENV=production`
2. ✅ Use strong JWT secrets
3. ✅ Configure proper CORS origins
4. ✅ Set up log rotation
5. ✅ Configure database indexes
6. ✅ Set up monitoring
7. ✅ Configure Firebase for push notifications

### Docker Support (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check database credentials in `.env`
   - Ensure MySQL is running
   - Verify database exists

2. **WebSocket Connection Issues**
   - Check CORS configuration
   - Verify JWT tokens
   - Check network connectivity

3. **High Memory Usage**
   - Monitor log file sizes
   - Check for memory leaks
   - Review connection pool settings

### Log Analysis

```bash
# View recent errors
tail -f logs/error-$(date +%Y-%m-%d).log

# Monitor WebSocket connections
tail -f logs/websocket-$(date +%Y-%m-%d).log

# Check application health
curl http://localhost:3000/health
```

## 📚 API Documentation

All endpoints now include:
- Input validation
- Error handling
- Performance logging
- Security checks

Refer to the individual route files for detailed endpoint documentation.

## 🔮 Future Enhancements

- Rate limiting implementation
- API documentation with Swagger
- Metrics collection with Prometheus
- Distributed tracing
- Caching layer with Redis
