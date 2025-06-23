// config/config.js
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath = path.resolve(__dirname, envFile);

// Load environment variables from file
const result = dotenv.config({ path: envPath });

// Check for errors loading .env file
if (result.error) {
  console.error(`Error loading environment variables from ${envPath}:`, result.error);
}

// Export configuration based on environment variables
module.exports = {
  // Node environment
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  
  // MongoDB configuration
  mongoUri: process.env.MONGO_URI,
  
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '30d',
  
  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || '*',
  
  // API configuration
  apiUrl: process.env.API_URL || '/api/v1',
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // Default: 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100 // Default: 100 requests per windowMs
  },
  
  // File upload configuration
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 1000000 // Default: 1MB
};