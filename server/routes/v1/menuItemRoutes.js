// routes/v1/menuItemRoutes.js
const express = require('express');
const { 
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  uploadMenuItemImage
} = require('../../controllers/v1/menuItemController');

const { protect, authorize, checkRestaurantOwnership } = require('../../middleware/auth');

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

module.exports = router;