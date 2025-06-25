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

// Rest of your router code...

export default router;