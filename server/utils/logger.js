// config/logger.js
const winston = require('winston');
require('winston-mongodb');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

/**
 * Custom format for development console output
 * - Includes timestamp, log level, message, metadata
 * - Color coded by log level
 * - Properly formats objects and errors
 */
const developmentFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    // Format the message
    let logMessage = `${timestamp} ${level}: ${message}`;
    
    // Add stack trace if it exists
    if (stack) {
      logMessage += `\n${stack}`;
    }
    
    // Add metadata if it exists and isn't empty
    const metaData = Object.keys(meta).filter(key => key !== 'timestamp' && key !== 'level');
    if (metaData.length > 0) {
      const metaString = JSON.stringify(
        metaData.reduce((obj, key) => {
          obj[key] = meta[key];
          return obj;
        }, {}),
        null, 2
      );
      logMessage += `\nMetadata: ${metaString}`;
    }
    
    return logMessage;
  })
);

/**
 * Production format
 * - JSON format for better parsing
 * - Includes all necessary metadata
 * - Structured for log analysis tools
 */
const productionFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.timestamp(),
  winston.format.json()
);

/**
 * Request formatter - used for HTTP request logging
 * Creates a standardized format for HTTP requests
 */
const requestFormat = winston.format((info) => {
  if (info.isHttpRequest) {
    // Standardize request logging
    const { req, res, responseTime, ...rest } = info;
    
    // Extract only needed request/response data
    return {
      ...rest,
      request: {
        method: req.method,
        url: req.originalUrl || req.url,
        params: req.params,
        query: req.query,
        // Only include body in development to avoid logging sensitive data in production
        body: process.env.NODE_ENV === 'development' ? req.body : undefined,
        headers: process.env.NODE_ENV === 'development' ? 
          req.headers : 
          {
            'user-agent': req.headers['user-agent'],
            'content-type': req.headers['content-type'],
            'accept': req.headers['accept']
          }
      },
      response: {
        statusCode: res.statusCode,
        responseTime: responseTime
      },
      user: req.user ? req.user.id : 'unauthenticated'
    };
  }
  return info;
});

// Define log levels with custom levels for application events
const logLevels = {
  levels: {
    error: 0,    // Errors and exceptions
    warn: 1,     // Warnings that don't stop execution
    info: 2,     // Important business events
    http: 3,     // HTTP requests
    debug: 4,    // Debugging information
    trace: 5,    // Detailed tracing for development
    db: 6        // Database operations
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
    trace: 'cyan',
    db: 'grey'
  }
};

// Add colors
winston.addColors(logLevels.colors);

// Set default log level based on environment
const defaultLogLevel = process.env.LOG_LEVEL || 
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Create transports based on environment
const transports = [];

// Console transport - different format for development vs production
transports.push(
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'trace',
    format: process.env.NODE_ENV === 'production' ?
      winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ) : 
      developmentFormat
  })
);

// File transports - used in all environments
transports.push(
  new winston.transports.File({ 
    filename: path.join(logDir, 'error.log'), 
    level: 'error',
    format: productionFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true
  }),
  new winston.transports.File({ 
    filename: path.join(logDir, 'combined.log'),
    format: productionFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true
  })
);

// HTTP requests log - separate file
transports.push(
  new winston.transports.File({
    filename: path.join(logDir, 'requests.log'),
    level: 'http',
    format: winston.format.combine(
      requestFormat(),
      productionFormat
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
);

// For development, add a debug log
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'debug.log'),
      level: 'debug',
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 2
    })
  );
}

// MongoDB transport for production only
if (process.env.NODE_ENV === 'production' && process.env.MONGO_URI) {
  try {
    transports.push(
      new winston.transports.MongoDB({
        db: process.env.MONGO_URI,
        options: {
          useUnifiedTopology: true,
          poolSize: 2,
          autoReconnect: true
        },
        collection: 'logs',
        level: 'error', // Only store errors in MongoDB
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
        metaKey: 'meta',
        handleExceptions: true,
        cappedSize: 10000000 // 10MB size limit
      })
    );
  } catch (error) {
    console.error(`Failed to add MongoDB transport: ${error.message}`);
  }
}

// Create the logger
const logger = winston.createLogger({
  levels: logLevels.levels,
  level: defaultLogLevel,
  defaultMeta: { service: 'restaurant-api' },
  transports,
  exitOnError: false // Don't exit on handled exceptions
});

// Handle uncaught exceptions
winston.exceptions.handle(
  new winston.transports.Console({ 
    format: developmentFormat
  }),
  new winston.transports.File({ 
    filename: path.join(logDir, 'exceptions.log'),
    format: productionFormat 
  })
);

// Expose special function for HTTP request logging
logger.logHttpRequest = (req, res, responseTime) => {
  logger.http('HTTP Request', { 
    isHttpRequest: true, 
    req, 
    res, 
    responseTime 
  });
};

// DB operation logging
logger.logDbOperation = (operation, collection, query, duration) => {
  logger.db('Database operation', {
    operation,
    collection,
    query: process.env.NODE_ENV === 'production' ? 
      JSON.stringify(query).substring(0, 100) + '...' : 
      query,
    durationMs: duration
  });
};

// Performance monitoring
logger.logPerformance = (label, durationMs, metadata = {}) => {
  const logLevel = durationMs > 1000 ? 'warn' : 'debug';
  logger[logLevel](`Performance: ${label}`, {
    ...metadata,
    durationMs,
    performance: true
  });
};

// Business events logging
logger.logBusinessEvent = (event, data) => {
  logger.info(`Business Event: ${event}`, {
    businessEvent: event,
    data
  });
};

// Security events logging
logger.logSecurityEvent = (event, data, level = 'warn') => {
  logger[level](`Security Event: ${event}`, {
    securityEvent: event,
    ...data
  });
};

// Add a simple way to measure execution time
logger.measureExecutionTime = (fn, label) => {
  return async (...args) => {
    const start = process.hrtime();
    try {
      return await fn(...args);
    } finally {
      const [seconds, nanoseconds] = process.hrtime(start);
      const durationMs = seconds * 1000 + nanoseconds / 1000000;
      logger.logPerformance(label, durationMs);
    }
  };
};

module.exports = logger;