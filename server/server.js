// server.js
import app from './app.js';
import connectDB from './config/db.js';
import logger from './utils/logger.js';

// Start server
const startServer = async () => {
  try {
    const conn = await connectDB();

    // Define port
    const PORT = process.env.PORT || 8001;

    // Start server
    app.listen(PORT, () => {
      logger.info(`App is listening on port ${PORT}`);

      // Log detailed info in development mode
      if (process.env.NODE_ENV === 'development') {
        const memoryUsage = process.memoryUsage();
        logger.debug('Server memory usage', {
          rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`
        });
      }
    });
  } catch (error) {
    logger.error('Server failed to start', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

// Run the server
startServer();