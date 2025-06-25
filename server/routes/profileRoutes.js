// routes/profileRoutes.js
import express from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import {
  getProfile,
  updateProfile,
  updatePassword,
  uploadProfilePhoto,
  deleteProfilePhoto,
  deleteAccount
} from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${uniqueSuffix}.${fileExt}`);
  }
});

// Filter file types
const fileFilter = (req, file, cb) => {
  // Accept only images
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB max file size
  },
  fileFilter: fileFilter
});

const router = express.Router();

// All profile routes are protected
router.use(protect);

// Get and update user profile
router.get('/', getProfile);

router.put('/', [
  // Optional fields with validation
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email'),
  
  body('phoneNumber')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/).withMessage('Please provide a valid phone number'),
  
  body('street')
    .optional()
    .trim(),
  
  body('city')
    .optional()
    .trim(),
  
  body('state')
    .optional()
    .trim(),
  
  body('zipcode')
    .optional()
    .trim(),
  
  body('country')
    .optional()
    .trim()
], validateRequest, updateProfile);

// Password update route
router.put('/password', [
  body('currentPassword')
    .trim()
    .not().isEmpty().withMessage('Current password is required'),
  
  body('newPassword')
    .trim()
    .not().isEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter'),
  
  body('newPasswordConfirm')
    .trim()
    .not().isEmpty().withMessage('Please confirm your new password')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
], validateRequest, updatePassword);

// Profile photo routes
router.put('/photo', upload.single('photo'), uploadProfilePhoto);
router.delete('/photo', deleteProfilePhoto);

// Delete account route
router.delete('/', [
  body('password')
    .trim()
    .not().isEmpty().withMessage('Please enter your password to confirm account deletion')
], validateRequest, deleteAccount);

export default router;