// routes/protectedRoutes.js
const express = require('express');
const { 
  getSensitiveData,
  updateSensitiveData 
} = require('../controllers/dataController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply protection middleware to all routes in this router
router.use(protect);

// Protected routes (authenticated users only)
router.get('/profile', getSensitiveData);

// Route with role-based access (admin only)
router.put('/admin/data', authorize('admin'), updateSensitiveData);

module.exports = router;