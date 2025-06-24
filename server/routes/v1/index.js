// routes/api/v1/index.js
const express = require('express');
const router = express.Router();

// Import sub-routers
const authRoutes = require('./auth');
const restaurantRoutes = require('./restaurants');
const menuRoutes = require('./menu');
const orderRoutes = require('./orders');
const reviewRoutes = require('./reviews');
const userRoutes = require('./users');

// Mount sub-routers
router.use('/auth', authRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/reviews', reviewRoutes);
router.use('/users', userRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'API is running' 
  });
});

module.exports = router;