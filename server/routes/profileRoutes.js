// routes/profileRoutes.js
const express = require('express');
const { getMe, updateDetails } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getMe)          // Using getMe from authController instead
  .put(updateDetails); // Using updateDetails from authController instead

module.exports = router;