// routes/v1/restaurantRoutes.js
import express from 'express';
import { 
  getRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  uploadRestaurantImage,
  getRestaurantMenuItems
} from '../../controllers/v1/restaurantController.js';

const router = express.Router();

// Public routes - anyone can view restaurants
router.get('/', getRestaurants);
router.get('/:id', getRestaurant);
router.get('/:id/menu', getRestaurantMenuItems);

// Protected routes - only restaurant owners and admins can manage restaurants
router.post('/', createRestaurant);

// Routes that require restaurant ownership verification
router.put('/:restaurantId', updateRestaurant);
router.delete('/:restaurantId', deleteRestaurant);
router.post('/:restaurantId/upload', uploadRestaurantImage);

export default router;