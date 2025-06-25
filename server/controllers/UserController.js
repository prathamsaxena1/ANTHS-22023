import { User } from "../models/User.js";
import { ApiError } from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

const generateAccessToken = (userId) => {
    return jwt.sign({ _id: userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY,
    });
};

const registerUser = asyncHandler(async (req, res) => {
    console.log("Register called");
    const { username, email, password } = req.body;
    const coverImg = req.files?.coverImg;

    if (!username || !email || !password || !coverImg) {
        throw new ApiError(401, "All the fields are required");
    }

    let user;
    try {
        console.log("Creating user ......");
        user = await User.create({
            username,
            email,
            password,
            avatar: coverImgUploaded.secure_url
        });
        console.log("User created......");
    } catch (error) {
        console.error("An error occurred while creating the user:", error);
        if (error.code === 11000) { // Duplicate key error
            throw new ApiError(410, 'User already registered');
        } else {
            throw new ApiError(500, 'Internal server error');
        }
    }

    const createdUser = await User.findById(user._id);
    return res.status(200).json({ createdUser });
});


const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) throw new ApiError(401, "Invalid email");
    if (!await user.isPasswordCorrect(password)) throw new ApiError(401, "Invalid password");

    const accessToken = generateAccessToken(user._id);
    
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    res.status(200)
        .cookie("accessToken", accessToken, options)
        .json({ user: await User.findById(user._id).select("-password"),
            token:accessToken
         });
});

// controllers/profileController.js
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';
import { uploadToCloudinary, removeFromCloudinary } from '../utils/fileUpload.js';

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res, next) => {
  // User is already available in req.user from the auth middleware
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Update user profile details
 * @route   PUT /api/v1/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res, next) => {
  // Fields to update
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    phoneNumber: req.body.phoneNumber,
    address: {
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      zipcode: req.body.zipcode,
      country: req.body.country
    },
    preferences: req.body.preferences // User preferences like notification settings, etc.
  };

  // Remove undefined fields (fields that weren't sent)
  Object.keys(fieldsToUpdate).forEach(key => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });

  // Special handling for nested address object
  if (fieldsToUpdate.address) {
    Object.keys(fieldsToUpdate.address).forEach(key => {
      if (fieldsToUpdate.address[key] === undefined) {
        delete fieldsToUpdate.address[key];
      }
    });
    
    // If address is empty after removing undefined fields, delete it
    if (Object.keys(fieldsToUpdate.address).length === 0) {
      delete fieldsToUpdate.address;
    }
  }

  // Check if email is being changed and if it's already in use
  if (fieldsToUpdate.email && fieldsToUpdate.email !== req.user.email) {
    const emailExists = await User.findOne({ email: fieldsToUpdate.email });
    if (emailExists) {
      return next(new AppError('Email is already in use', 400));
    }
  }

  // Find and update user
  const user = await User.findByIdAndUpdate(
    req.user.id, 
    fieldsToUpdate, 
    { 
      new: true,       // Return the updated object
      runValidators: true  // Run model validators
    }
  );

  res.status(200).json({
    success: true,
    data: user,
    message: 'Profile updated successfully'
  });
});

/**
 * @desc    Update user password
 * @route   PUT /api/v1/profile/password
 * @access  Private
 */
const updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword, newPasswordConfirm } = req.body;

  // Check if all required fields are provided
  if (!currentPassword || !newPassword || !newPasswordConfirm) {
    return next(new AppError('Please provide all password fields', 400));
  }

  // Check if new passwords match
  if (newPassword !== newPasswordConfirm) {
    return next(new AppError('New passwords do not match', 400));
  }

  // Get user with password field
  const user = await User.findById(req.user.id).select('+password');

  // Check if current password is correct
  if (!(await user.matchPassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save(); // Use save() to trigger password hashing middleware

  // Send token response (re-authentication)
  sendTokenResponse(user, 200, res);
});

/**
 * @desc    Upload profile photo
 * @route   PUT /api/v1/profile/photo
 * @access  Private
 */
const uploadProfilePhoto = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload a file', 400));
  }

  // Get current user
  const user = await User.findById(req.user.id);

  // Delete old avatar from cloudinary if exists
  if (user.avatar && user.avatar.public_id) {
    await removeFromCloudinary(user.avatar.public_id);
  }

  // Upload to cloudinary
  const result = await uploadToCloudinary(req.file.path, 'avatars');

  // Update user with new avatar
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      avatar: {
        public_id: result.public_id,
        url: result.secure_url
      }
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: updatedUser,
    message: 'Profile photo updated successfully'
  });
});

/**
 * @desc    Delete profile photo
 * @route   DELETE /api/v1/profile/photo
 * @access  Private
 */
const deleteProfilePhoto = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  // Check if user has an avatar
  if (!user.avatar || !user.avatar.public_id) {
    return next(new AppError('No profile photo to delete', 400));
  }

  // Delete from cloudinary
  await removeFromCloudinary(user.avatar.public_id);

  // Remove avatar from user
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { $unset: { avatar: 1 } },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: updatedUser,
    message: 'Profile photo removed successfully'
  });
});

/**
 * @desc    Delete user account
 * @route   DELETE /api/v1/profile
 * @access  Private
 */
const deleteAccount = asyncHandler(async (req, res, next) => {
  // Get user to check password
  const user = await User.findById(req.user.id).select('+password');
  
  // Verify password for security
  if (!(await user.matchPassword(req.body.password))) {
    return next(new AppError('Password is incorrect', 401));
  }

  // Delete the user account
  await User.findByIdAndDelete(req.user.id);

  // Clear cookies
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {},
    message: 'Account deleted successfully'
  });
});

// Helper function for sending token response
const sendTokenResponse = (user, statusCode, res) => {
  // Generate token
  const token = user.getSignedJwtToken();

  // Cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  // Set secure flag in production
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  // Remove password from response
  user.password = undefined;

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      data: user
    });
};


export { registerUser, loginUser };
