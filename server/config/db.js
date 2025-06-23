const mongoose = require('mongoose');
const colors = require('colors'); // Optional: for colored console output

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    // Build connection string based on environment variables
    let connectionString = process.env.MONGO_URI;
    
    // Replace username and password if they exist separately
    if (process.env.MONGO_USER && process.env.MONGO_PASSWORD && connectionString.includes('<username>')) {
      connectionString = connectionString
        .replace('<username>', process.env.MONGO_USER)
        .replace('<password>', process.env.MONGO_PASSWORD);
    }

    // MongoDB connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Mongoose 6+ no longer supports these options
      // useCreateIndex: true, 
      // useFindAndModify: false
    };

    // Connect to the database
    const conn = await mongoose.connect(connectionString, options);

    // Log success message
    console.log(
      colors ? 
      `MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold :
      `MongoDB Connected: ${conn.connection.host}`
    );
    
    return conn;
  } catch (error) {
    // Log error message
    console.error(
      colors ? 
      `Error: ${error.message}`.red.bold :
      `Error: ${error.message}`
    );
    
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;