// routes/v1/menuItemRoutes.js
import express from 'express';
import { 
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  uploadMenuItemImage
} from '../../controllers/v1/menuItemController.js';

import { protect, authorize, checkRestaurantOwnership } from '../../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// Public routes - anyone can view menu items
router.get('/', getMenuItems);
router.get('/:itemId', getMenuItem);

// Protected routes - only restaurant owners and admins can manage menu items
router.post('/', 
  protect, 
  authorize('restaurantOwner', 'admin'), 
  checkRestaurantOwnership, 
  createMenuItem
);

// Routes that require restaurant ownership verification
router.put('/:itemId', 
  protect, 
  authorize('restaurantOwner', 'admin'), 
  checkRestaurantOwnership, 
  updateMenuItem
);

router.delete('/:itemId', 
  protect, 
  authorize('restaurantOwner', 'admin'), 
  checkRestaurantOwnership, 
  deleteMenuItem
);

router.post('/:itemId/upload', 
  protect, 
  authorize('restaurantOwner', 'admin'), 
  checkRestaurantOwnership, 
  uploadMenuItemImage
);

export default router;