// config/config.js
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.resolve(__dirname, envFile) });

module.exports = {
  // Node.js environment
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  
  // MongoDB configuration
  mongodb: {
    uri: process.env.MONGO_URI,
    user: process.env.MONGO_USER,
    password: process.env.MONGO_PASSWORD,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expireIn: process.env.JWT_EXPIRE || '30d',
    cookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE, 10) || 30
  },
  
  // File upload configuration
  fileUpload: {
    path: process.env.FILE_UPLOAD_PATH || './public/uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 1000000 // 1MB
  },
  
  // API configuration
  api: {
    baseUrl: process.env.API_BASE_URL || '/api/v1',
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100 // limit each IP to 100 requests per windowMs
    }
  }
};