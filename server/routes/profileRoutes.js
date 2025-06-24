// routes/profileRoutes.js
const express = require('express');
const {
  getUserProfile,
  updateProfile
} = require('../controllers/profileController');

const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getUserProfile)
  .put(updateProfile);

module.exports = router;