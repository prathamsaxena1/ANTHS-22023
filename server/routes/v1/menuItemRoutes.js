// routes/v1/menuItemRoutes.js
import express from 'express';
import {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  uploadMenuItemImage,
  batchCreateMenuItems,
  toggleMenuItemAvailability
} from '../../controllers/v1/menuItemController.js';

import { protect, authorize, checkRestaurantOwnership } from '../../middleware/auth.js';
import advancedResults from '../../middleware/advancedResults.js';
import MenuItem from '../../models/MenuItem.js';

// mergeParams allows us to access params from parent router
const router = express.Router({ mergeParams: true });

// Routes for all menu items (not specific to a restaurant)
router.route('/')
  .get(
    advancedResults(MenuItem, 'restaurant'),
    getMenuItems
  );

// Routes for menu items inside a restaurant context
// Apply restaurant ownership check to all protected routes
router.use(protect);

// Public routes (already protected by the router.use above)
router.route('/')
  .post(
    authorize('restaurantOwner', 'admin'),
    checkRestaurantOwnership,
    createMenuItem
  );

// Batch create many menu items at once
router.route('/batch')
  .post(
    authorize('restaurantOwner', 'admin'),
    checkRestaurantOwnership,
    batchCreateMenuItems
  );

// Routes for specific menu item
router.route('/:id')
  .get(getMenuItem)
  .put(
    authorize('restaurantOwner', 'admin'),
    checkRestaurantOwnership,
    updateMenuItem
  )
  .delete(
    authorize('restaurantOwner', 'admin'),
    checkRestaurantOwnership,
    deleteMenuItem
  );

// Upload image for menu item
router.route('/:id/upload-image')
  .post(
    authorize('restaurantOwner', 'admin'),
    checkRestaurantOwnership,
    uploadMenuItemImage
  );

// Toggle menu item availability
router.route('/:id/toggle-availability')
  .patch(
    authorize('restaurantOwner', 'admin'),
    checkRestaurantOwnership,
    toggleMenuItemAvailability
  );

export default router;