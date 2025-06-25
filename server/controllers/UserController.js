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

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/users/profile
 * @access  Private
 */
exports.getCurrentUserProfile = asyncHandler(async (req, res, next) => {
    // User is already available in req object from the auth middleware
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
   * @desc    Update user profile
   * @route   PUT /api/v1/users/profile
   * @access  Private
   */
  exports.updateProfile = asyncHandler(async (req, res, next) => {
    // Fields allowed to be updated
    const allowedFields = {
      name: req.body.name,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      preferences: req.body.preferences
    };
  
    // Filter out undefined fields
    const updateData = Object.entries(allowedFields)
      .reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});
  
    // If email is being updated, check if it's already in use
    if (updateData.email) {
      const existingUser = await User.findOne({ 
        email: updateData.email,
        _id: { $ne: req.user.id }
      });
  
      if (existingUser) {
        return next(new AppError('Email already in use by another account', 400));
      }
    }
  
    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );
  
    if (!updatedUser) {
      return next(new AppError('User not found', 404));
    }
  
    res.status(200).json({
      success: true,
      data: updatedUser
    });
  });
  
  /**
   * @desc    Upload profile picture
   * @route   PUT /api/v1/users/profile/picture
   * @access  Private
   */
  exports.updateProfilePicture = asyncHandler(async (req, res, next) => {
    if (!req.file) {
      return next(new AppError('Please upload a file', 400));
    }
  
    const user = await User.findById(req.user.id);
  
    if (!user) {
      return next(new AppError('User not found', 404));
    }
  
    // If user already has a profile picture, delete the old one
    if (user.profilePicture && user.profilePicture.key) {
      await deleteFromS3(user.profilePicture.key);
    }
  
    // Upload new file to S3
    const result = await uploadToS3(req.file, 'profile-pictures');
  
    // Update user profile with new image details
    user.profilePicture = {
      url: result.Location,
      key: result.Key
    };
  
    await user.save();
  
    res.status(200).json({
      success: true,
      data: {
        profilePicture: user.profilePicture
      }
    });
  });
  
  /**
   * @desc    Change user password
   * @route   PUT /api/v1/users/profile/password
   * @access  Private
   */
  exports.changePassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
  
    if (!currentPassword || !newPassword || !confirmPassword) {
      return next(new AppError('Please provide all password fields', 400));
    }
  
    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return next(new AppError('New passwords do not match', 400));
    }
  
    // Get user with password field
    const user = await User.findById(req.user.id).select('+password');
  
    if (!user) {
      return next(new AppError('User not found', 404));
    }
  
    // Check if current password is correct
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return next(new AppError('Current password is incorrect', 401));
    }
  
    // Update password
    user.password = newPassword;
    await user.save();
  
    // Send token response (re-authenticate user)
    const token = user.getSignedJwtToken();
  
    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      token
    });
  });
  
  /**
   * @desc    Delete user profile
   * @route   DELETE /api/v1/users/profile
   * @access  Private
   */
  exports.deleteProfile = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);
  
    if (!user) {
      return next(new AppError('User not found', 404));
    }
  
    // Delete profile picture from S3 if it exists
    if (user.profilePicture && user.profilePicture.key) {
      await deleteFromS3(user.profilePicture.key);
    }
  
    // Additional cleanup might be needed (delete related data, etc.)
    // You might want to archive user data instead of completely deleting it
  
    await User.findByIdAndDelete(req.user.id);
  
    res.status(200).json({
      success: true,
      message: 'User account successfully deleted'
    });
  });
  


export { registerUser, loginUser };
