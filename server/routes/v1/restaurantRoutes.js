// routes/v1/restaurantRoutes.js
const express = require('express');
const { 
  getRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  uploadRestaurantImage,
  getRestaurantMenuItems
} = require('../../controllers/v1/restaurantController');

const { protect, authorize, checkRestaurantOwnership } = require('../../middleware/auth');

const router = express.Router();

// Public routes - anyone can view restaurants
router.get('/', getRestaurants);
router.get('/:id', getRestaurant);
router.get('/:id/menu', getRestaurantMenuItems);

// Protected routes - only restaurant owners and admins can manage restaurants
router.post('/', protect, authorize('restaurantOwner', 'admin'), createRestaurant);

// Routes that require restaurant ownership verification
router.put('/:restaurantId', protect, authorize('restaurantOwner', 'admin'), checkRestaurantOwnership, updateRestaurant);
router.delete('/:restaurantId', protect, authorize('restaurantOwner', 'admin'), checkRestaurantOwnership, deleteRestaurant);
router.post('/:restaurantId/upload', protect, authorize('restaurantOwner', 'admin'), checkRestaurantOwnership, uploadRestaurantImage);

module.exports = router;