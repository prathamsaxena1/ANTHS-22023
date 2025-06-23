// middleware/cors.js
const cors = require('cors');
const config = require('../config/config');

// Parse and prepare allowed origins
const parseOrigins = (origins) => {
  if (origins === '*') return origins;
  return origins.split(',').map(origin => origin.trim());
};

// Configure CORS options
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = parseOrigins(config.corsOrigin);
    
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins === '*' || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true, // Allow cookies to be sent with requests
  optionsSuccessStatus: 204, // Some legacy browsers choke on 204
  maxAge: 86400 // Cache preflight response for 24 hours
};

// Create configured middleware
const corsMiddleware = cors(corsOptions);

module.exports = corsMiddleware;