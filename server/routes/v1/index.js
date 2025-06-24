// routes/api/v1/index.js
const express = require('express');
const router = express.Router();
const advancedResults = require('../../../middleware/advancedResults');

// Import route modules
const authRoutes = require('./auth');
const restaurantRoutes = require('./restaurants');
const menuRoutes = require('./menu');
const orderRoutes = require('./orders');
const reviewRoutes = require('./reviews');
const userRoutes = require('./users');
const reservationRoutes = require('./reservations');
const paymentRoutes = require('./payments');

// Mount API route modules
router.use('/auth', authRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/reviews', reviewRoutes);
router.use('/users', userRoutes); 
router.use('/reservations', reservationRoutes);
router.use('/payments', paymentRoutes);

// API documentation endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Restaurant Ordering API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      restaurants: '/api/v1/restaurants',
      menu: '/api/v1/menu',
      orders: '/api/v1/orders',
      reviews: '/api/v1/reviews',
      users: '/api/v1/users',
      reservations: '/api/v1/reservations',
      payments: '/api/v1/payments'
    }
  });
});

module.exports = router;