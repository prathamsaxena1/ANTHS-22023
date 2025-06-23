// routes/health.js
const express = require('express');
const { 
  getHealthStatus, 
  getDetailedHealth, 
  getLightHealth 
} = require('../controllers/healthController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Basic health check - publicly accessible
router.get('/', getHealthStatus);

// Light health check for high-frequency monitoring
router.get('/light', getLightHealth);

// Detailed health check - restricted to admins
router.get('/detailed', protect, authorize('admin'), getDetailedHealth);

module.exports = router;