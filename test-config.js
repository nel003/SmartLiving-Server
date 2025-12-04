// Test script to verify environment configuration
require('dotenv').config();

console.log('🔍 Testing Environment Configuration...\n');

// Test database configuration
console.log('📊 Database Configuration:');
console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`  User: ${process.env.DB_USER || 'root'}`);
console.log(`  Password: ${process.env.DB_PASSWORD === undefined ? 'NOT SET' : `"${process.env.DB_PASSWORD}"`}`);
console.log(`  Database: ${process.env.DB_NAME || 'smartliving'}`);

// Test JWT configuration
console.log('\n🔐 JWT Configuration:');
console.log(`  Secret: ${process.env.JWT_SECRET ? 'SET' : 'NOT SET'}`);
console.log(`  Refresh Secret: ${process.env.JWT_REFRESH_SECRET ? 'SET' : 'NOT SET'}`);
console.log(`  Key Secret: ${process.env.JWT_KEY_SECRET ? 'SET' : 'NOT SET'}`);

// Test server configuration
console.log('\n🚀 Server Configuration:');
console.log(`  Port: ${process.env.PORT || '3000'}`);
console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);

// Test CORS configuration
console.log('\n🌐 CORS Configuration:');
console.log(`  Origins: ${process.env.CORS_ORIGIN || 'NOT SET'}`);

// Test logging configuration
console.log('\n📝 Logging Configuration:');
console.log(`  Level: ${process.env.LOG_LEVEL || 'info'}`);
console.log(`  File: ${process.env.LOG_FILE || 'logs/app.log'}`);

console.log('\n✅ Configuration test complete!');

// Test if we can import the config
try {
  const { config } = require('./dist/config/environment.js');
  console.log('\n🎉 Config import successful!');
  console.log('Database config:', config.database);
} catch (error) {
  console.log('\n❌ Config import failed:', error.message);
  console.log('💡 Try running: npm run build');
}
