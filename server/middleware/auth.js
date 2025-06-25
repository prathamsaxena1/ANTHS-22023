// middleware/auth.js
import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';

// Protect routes - verify JWT token
export const protect = asyncHandler(async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Get token from header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    // Get token from cookie
    token = req.cookies.token;
  }
  
  // Check if token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Set req.user
    req.user = await User.findById(decoded.id);
    
    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(`User role ${req.user.role} is not authorized to access this route`, 403)
      );
    }
    next();
  };
};

// Check if user owns a restaurant
export const checkRestaurantOwnership = asyncHandler(async (req, res, next) => {
  // Get restaurant ID from params
  const restaurantId = req.params.restaurantId;
  
  // Find restaurant
  const restaurant = await Restaurant.findById(restaurantId);
  
  // Check if restaurant exists
  if (!restaurant) {
    return next(new ErrorResponse(`Restaurant not found with id of ${restaurantId}`, 404));
  }
  
  // Check if user is restaurant owner or admin
  if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to manage this restaurant`,
        403
      )
    );
  }
  
  // If ownership check passes, add restaurant to req object for potential use in controllers
  req.restaurant = restaurant;
  next();
});