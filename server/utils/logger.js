// utils/logger.js
const winston = require('winston');
require('winston-mongodb');

// Define log formats
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level}: ${message}`;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  defaultMeta: { service: 'restaurant-api' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: consoleFormat
    }),
    // File transports for all environments
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: fileFormat
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      format: fileFormat
    })
  ],
  // Create the log directory if it doesn't exist
  exitOnError: false
});

// Add MongoDB transport in production with appropriate error handling
if (process.env.NODE_ENV === 'production' && process.env.MONGO_URI) {
  try {
    logger.add(
      new winston.transports.MongoDB({
        db: process.env.MONGO_URI,
        options: { useUnifiedTopology: true },
        collection: 'logs',
        level: 'error',
        tryReconnect: true,
        metaKey: 'meta'
      })
    );
  } catch (error) {
    logger.error(`Failed to add MongoDB transport: ${error.message}`);
  }
}

// Handle uncaught exceptions and rejections
winston.exceptions.handle(
  new winston.transports.File({ filename: 'logs/exceptions.log' })
);

// Create log directory
const fs = require('fs');
const path = require('path');
const logDir = 'logs';

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

module.exports = logger;