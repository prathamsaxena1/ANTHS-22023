// scripts/testDbConnection.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const colors = require('colors');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../config/.env') });

// Test database connection
const testConnection = async () => {
  try {
    // Build connection string
    let connectionString = process.env.MONGO_URI;
    
    // Replace credentials if needed
    if (process.env.MONGO_USER && process.env.MONGO_PASSWORD) {
      connectionString = connectionString
        .replace('<username>', process.env.MONGO_USER)
        .replace('<password>', process.env.MONGO_PASSWORD);
    }
    
    console.log('Attempting to connect to MongoDB...');
    console.log(`Connection string: ${connectionString.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`); // Mask credentials
    
    // Connect to MongoDB
    const conn = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`.green.underline.bold);
    console.log('Connection details:'.cyan);
    console.log(`  Database name: ${conn.connection.name}`.cyan);
    console.log(`  MongoDB version: ${conn.version}`.cyan);
    
    // Test a simple operation
    console.log('\nTesting connection with a simple operation...'.yellow);
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('Collections in database:'.cyan);
    
    if (collections.length === 0) {
      console.log('  No collections found (database is empty)'.cyan);
    } else {
      collections.forEach(collection => {
        console.log(`  - ${collection.name}`.cyan);
      });
    }
    
    // Close the connection
    console.log('\nClosing connection...'.yellow);
    await mongoose.connection.close();
    console.log('Connection closed successfully'.green);
    
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`.red.bold);
    console.error(error);
  } finally {
    // Exit the process
    process.exit();
  }
};

// Run the test
testConnection();