// app.js
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const config = require('./config/config');
const corsMiddleware = require('./middleware/cors');
const { jsonParser, urlencodedParser } = require('./middleware/bodyParser');
const errorHandler = require('./middleware/errorHandler');

// Initialize express app
const app = express();

// Apply security-related middleware early
app.use(helmet());

// Apply CORS middleware
app.use(corsMiddleware);

// Body parser middleware
app.use(jsonParser);
app.use(urlencodedParser);

// Cookie parser
app.use(cookieParser());

// Sanitize data
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api', limiter); // Apply rate limiting to API routes

// Prevent HTTP param pollution
app.use(hpp());

// Compress responses
app.use(compression());

// Dev logging middleware
if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Mount routers
app.use(`${config.apiUrl}/auth`, require('./routes/auth'));
app.use(`${config.apiUrl}/restaurants`, require('./routes/restaurants'));
app.use(`${config.apiUrl}/menu`, require('./routes/menu'));
app.use(`${config.apiUrl}/orders`, require('./routes/orders'));
app.use(`${config.apiUrl}/reviews`, require('./routes/reviews'));
app.use('/api/health', require('./routes/health'));

// Home route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Restaurant Ordering API is running',
    environment: config.env,
    apiVersion: '1.0.0'
  });
});

// Handle 404 routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

module.exports = app;