// utils/logger.js
const winston = require('winston');
require('winston-mongodb');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'restaurant-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Add MongoDB transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.MongoDB({
      db: process.env.MONGO_URI,
      options: { useUnifiedTopology: true },
      collection: 'logs',
      level: 'error'
    })
  );
}

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

module.exports = logger;