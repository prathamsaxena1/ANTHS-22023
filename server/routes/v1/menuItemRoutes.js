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

const router = express.Router({ mergeParams: true });

// Public routes - anyone can view menu items
router.get('/', getMenuItems);
router.get('/:itemId', getMenuItem);

// Protected routes - only restaurant owners and admins can manage menu items
router.post('/', 
  createMenuItem
);

// Routes that require restaurant ownership verification
router.put('/:itemId', 
  updateMenuItem
);

router.delete('/:itemId', 
  deleteMenuItem
);

router.post('/:itemId/upload', 
  uploadMenuItemImage
);

export default router;