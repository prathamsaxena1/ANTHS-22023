// Load environment variables first
const dotenv = require('dotenv');
const path = require('path');

// Determine environment file based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';

// Load environment variables from the appropriate file
dotenv.config({ path: path.resolve(__dirname, 'config', envFile) });

// Now import other modules that might use env variables
const express = require('express');
const colors = require('colors'); // Optional: for colored console output
const connectDB = require('./config/db');
const app = require('./app');

// Connect to database
connectDB()
  .then(() => {
    // Start the server after successful database connection
    const PORT = process.env.PORT || 5000;
    
    const server = app.listen(
      PORT,
      console.log(
        colors ?
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold :
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      )
    );
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.log(
        colors ?
        `Error: ${err.message}`.red :
        `Error: ${err.message}`
      );
      // Close server & exit process
      server.close(() => process.exit(1));
    });
  })
  .catch(err => {
    console.error('Failed to connect to the database, server not started');
    console.error(err);
    process.exit(1);
  });