import winston from 'winston';
import 'winston-mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Required for __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const developmentFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} ${level}: ${message}`;
    if (stack) {
      logMessage += `\n${stack}`;
    }
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

const productionFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.timestamp(),
  winston.format.json()
);

const requestFormat = winston.format((info) => {
  if (info.isHttpRequest) {
    const { req, res, responseTime, ...rest } = info;
    return {
      ...rest,
      request: {
        method: req.method,
        url: req.originalUrl || req.url,
        params: req.params,
        query: req.query,
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

const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
    trace: 5,
    db: 6
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

winston.addColors(logLevels.colors);

const defaultLogLevel = process.env.LOG_LEVEL || 
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const transports = [];

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

transports.push(
  new winston.transports.File({ 
    filename: path.join(logDir, 'error.log'), 
    level: 'error',
    format: productionFormat,
    maxsize: 5242880,
    maxFiles: 5,
    tailable: true
  }),
  new winston.transports.File({ 
    filename: path.join(logDir, 'combined.log'),
    format: productionFormat,
    maxsize: 5242880,
    maxFiles: 5,
    tailable: true
  })
);

transports.push(
  new winston.transports.File({
    filename: path.join(logDir, 'requests.log'),
    level: 'http',
    format: winston.format.combine(
      requestFormat(),
      productionFormat
    ),
    maxsize: 5242880,
    maxFiles: 5
  })
);

if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'debug.log'),
      level: 'debug',
      format: productionFormat,
      maxsize: 5242880,
      maxFiles: 2
    })
  );
}

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
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
        metaKey: 'meta',
        handleExceptions: true,
        cappedSize: 10000000
      })
    );
  } catch (error) {
    console.error(`Failed to add MongoDB transport: ${error.message}`);
  }
}

const logger = winston.createLogger({
  levels: logLevels.levels,
  level: defaultLogLevel,
  defaultMeta: { service: 'restaurant-api' },
  transports,
  exitOnError: false
});

winston.exceptions.handle(
  new winston.transports.Console({ 
    format: developmentFormat
  }),
  new winston.transports.File({ 
    filename: path.join(logDir, 'exceptions.log'),
    format: productionFormat 
  })
);

logger.logHttpRequest = (req, res, responseTime) => {
  logger.http('HTTP Request', { 
    isHttpRequest: true, 
    req, 
    res, 
    responseTime 
  });
};

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

logger.logPerformance = (label, durationMs, metadata = {}) => {
  const logLevel = durationMs > 1000 ? 'warn' : 'debug';
  logger[logLevel](`Performance: ${label}`, {
    ...metadata,
    durationMs,
    performance: true
  });
};

logger.logBusinessEvent = (event, data) => {
  logger.info(`Business Event: ${event}`, {
    businessEvent: event,
    data
  });
};

logger.logSecurityEvent = (event, data, level = 'warn') => {
  logger[level](`Security Event: ${event}`, {
    securityEvent: event,
    ...data
  });
};

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

export default logger;