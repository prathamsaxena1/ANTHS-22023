// app.js
const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/error');

// Load environment variables
dotenv.config({ path: './config/config.env' });

// Route files
const auth = require('./routes/authRoutes');
const profile = require('./routes/profileRoutes');

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Mount routers
app.use('/api/auth', auth);
app.use('/api/profile', profile);

// Error handler middleware
app.use(errorHandler);

module.exports = app;