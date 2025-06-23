// controllers/healthController.js
const mongoose = require('mongoose');
const asyncHandler = require('../middleware/asyncHandler');
const os = require('os');

/**
 * @desc    Get basic server health status
 * @route   GET /api/health
 * @access  Public
 */
exports.getHealthStatus = asyncHandler(async (req, res) => {
  // Check database connection
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  // Prepare response
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())} seconds`,
    server: {
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      memory: {
        totalMB: Math.round(os.totalmem() / 1024 / 1024),
        freeMB: Math.round(os.freemem() / 1024 / 1024),
        usage: `${Math.round((os.totalmem() - os.freemem()) / os.totalmem() * 100)}%`
      },
      cpus: os.cpus().length
    },
    database: {
      status: dbStatus,
      name: mongoose.connection.name || 'unknown'
    }
  };
  
  // Set status code based on critical services
  const statusCode = dbStatus === 'connected' ? 200 : 503;
  
  res.status(statusCode).json(healthData);
});

/**
 * @desc    Get detailed health information
 * @route   GET /api/health/detailed
 * @access  Private (typically restricted to admin or monitoring systems)
 */
exports.getDetailedHealth = asyncHandler(async (req, res) => {
  // Basic health info
  const basicHealth = await exports.getHealthStatus(req, res, true);
  
  // Add more detailed information
  const detailedHealth = {
    ...basicHealth,
    memory: process.memoryUsage(),
    server: {
      ...basicHealth.server,
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      hostname: os.hostname(),
      loadAvg: os.loadavg(),
      networkInterfaces: os.networkInterfaces()
    },
    database: {
      ...basicHealth.database,
      models: Object.keys(mongoose.models),
      collections: await mongoose.connection.db.listCollections().toArray(),
      connectionOptions: mongoose.connection.config || {}
    }
  };
  
  res.status(200).json(detailedHealth);
});

// Simple health check that returns minimal data (useful for frequent monitoring)
exports.getLightHealth = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: 'ok',
    time: Date.now()
  });
});