const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const errorHandler = require('./middleware/errorHandler');

// Load env variables
dotenv.config({ path: './config/config.env' });

// Initialize Express app
const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Enable CORS
app.use(cors());

// Sanitize data
app.use(mongoSanitize());

// Compress responses
app.use(compression());

// Set static folder
app.use(express.static('public'));

// Define Routes
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'Restaurant Ordering API is running'
  });
});

// Future route mounting will go here
// app.use('/api/v1/auth', require('./routes/auth'));
// app.use('/api/v1/menu', require('./routes/menu'));
// app.use('/api/v1/orders', require('./routes/orders'));
// app.use('/api/v1/restaurants', require('./routes/restaurants'));
// app.use('/api/v1/reviews', require('./routes/reviews'));

// Error handler middleware (should be last)
app.use(errorHandler);

module.exports = app;