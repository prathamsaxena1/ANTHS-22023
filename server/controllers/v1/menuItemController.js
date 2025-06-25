// controllers/v1/menuItemController.js
import mongoose from 'mongoose';
import MenuItem from '../../models/MenuItem.js';
import Restaurant from '../../models/Restaurant.js';
import ErrorResponse from '../../utils/errorResponse.js';
import asyncHandler from '../../middleware/asyncHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * @desc    Get all menu items (can be filtered by restaurant)
 * @route   GET /api/v1/menu-items
 * @route   GET /api/v1/restaurants/:restaurantId/menu-items
 * @access  Public
 */
export const getMenuItems = asyncHandler(async (req, res, next) => {
  if (req.params.restaurantId) {
    // Get menu items for a specific restaurant
    const menuItems = await MenuItem.find({ restaurant: req.params.restaurantId });
    
    return res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } else {
    // Return results from advancedResults middleware
    res.status(200).json(res.advancedResults);
  }
});

/**
 * @desc    Get single menu item
 * @route   GET /api/v1/menu-items/:id
 * @route   GET /api/v1/restaurants/:restaurantId/menu-items/:id
 * @access  Public
 */
export const getMenuItem = asyncHandler(async (req, res, next) => {
  const menuItem = await MenuItem.findById(req.params.id).populate({
    path: 'restaurant',
    select: 'name description address'
  });

  if (!menuItem) {
    return next(new ErrorResponse(`Menu item not found with id of ${req.params.id}`, 404));
  }

  // If accessing through restaurant route, verify it belongs to that restaurant
  if (req.params.restaurantId && menuItem.restaurant._id.toString() !== req.params.restaurantId) {
    return next(new ErrorResponse(`Menu item not found in this restaurant`, 404));
  }

  res.status(200).json({
    success: true,
    data: menuItem
  });
});

/**
 * @desc    Add new menu item to restaurant
 * @route   POST /api/v1/restaurants/:restaurantId/menu-items
 * @access  Private (Restaurant Owner, Admin)
 */
export const createMenuItem = asyncHandler(async (req, res, next) => {
  // Add restaurant ID to req.body
  req.body.restaurant = req.params.restaurantId;
  
  // Find restaurant to verify it exists and check ownership
  const restaurant = await Restaurant.findById(req.params.restaurantId);
  
  if (!restaurant) {
    return next(new ErrorResponse(`Restaurant not found with id of ${req.params.restaurantId}`, 404));
  }
  
  // Verify restaurant ownership
  if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to add menu items to this restaurant`,
        403
      )
    );
  }
  
  // Create the menu item
  const menuItem = await MenuItem.create(req.body);
  
  res.status(201).json({
    success: true,
    data: menuItem
  });
});

/**
 * @desc    Update menu item
 * @route   PUT /api/v1/restaurants/:restaurantId/menu-items/:id
 * @access  Private (Restaurant Owner, Admin)
 */
export const updateMenuItem = asyncHandler(async (req, res, next) => {
  let menuItem = await MenuItem.findById(req.params.id);
  
  if (!menuItem) {
    return next(new ErrorResponse(`Menu item not found with id of ${req.params.id}`, 404));
  }
  
  // Verify item belongs to the restaurant
  if (menuItem.restaurant.toString() !== req.params.restaurantId) {
    return next(new ErrorResponse(`Menu item not found in this restaurant`, 404));
  }
  
  // Find restaurant to check ownership
  const restaurant = await Restaurant.findById(req.params.restaurantId);
  
  // Verify restaurant ownership
  if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update menu items for this restaurant`,
        403
      )
    );
  }
  
  // Update the menu item
  menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: menuItem
  });
});

/**
 * @desc    Delete menu item
 * @route   DELETE /api/v1/restaurants/:restaurantId/menu-items/:id
 * @access  Private (Restaurant Owner, Admin)
 */
export const deleteMenuItem = asyncHandler(async (req, res, next) => {
  const menuItem = await MenuItem.findById(req.params.id);
  
  if (!menuItem) {
    return next(new ErrorResponse(`Menu item not found with id of ${req.params.id}`, 404));
  }
  
  // Verify item belongs to the restaurant
  if (menuItem.restaurant.toString() !== req.params.restaurantId) {
    return next(new ErrorResponse(`Menu item not found in this restaurant`, 404));
  }
  
  // Find restaurant to check ownership
  const restaurant = await Restaurant.findById(req.params.restaurantId);
  
  // Verify restaurant ownership
  if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete menu items for this restaurant`,
        403
      )
    );
  }
  
  // Remove the menu item
  await menuItem.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Upload menu item image
 * @route   POST /api/v1/restaurants/:restaurantId/menu-items/:id/upload-image
 * @access  Private (Restaurant Owner, Admin)
 */
export const uploadMenuItemImage = asyncHandler(async (req, res, next) => {
  const menuItem = await MenuItem.findById(req.params.id);
  
  if (!menuItem) {
    return next(new ErrorResponse(`Menu item not found with id of ${req.params.id}`, 404));
  }
  
  // Verify item belongs to the restaurant
  if (menuItem.restaurant.toString() !== req.params.restaurantId) {
    return next(new ErrorResponse(`Menu item not found in this restaurant`, 404));
  }
  
  // Find restaurant to check ownership
  const restaurant = await Restaurant.findById(req.params.restaurantId);
  
  // Verify restaurant ownership
  if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update menu items for this restaurant`,
        403
      )
    );
  }
  
  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }
  
  const file = req.files.file;
  
  // Validate file type
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Please upload an image file`, 400));
  }
  
  // Check file size
  const maxSize = process.env.MAX_FILE_UPLOAD || 1000000; // Default 1MB
  if (file.size > maxSize) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${maxSize / 1000000}MB`,
        400
      )
    );
  }
  
  // Create custom filename
  const fileExt = path.parse(file.name).ext;
  file.name = `menu_item_${menuItem._id}${fileExt}`;
  
  // Define upload path
  const uploadPath = process.env.FILE_UPLOAD_PATH || './public/uploads';
  const fullPath = `${uploadPath}/menu-items`;
  
  // Move the file
  file.mv(`${fullPath}/${file.name}`, async (err) => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }
    
    // Update menu item with image info
    await MenuItem.findByIdAndUpdate(req.params.id, {
      image: {
        url: `/uploads/menu-items/${file.name}`,
        alt: req.body.alt || menuItem.name
      }
    });
    
    // Get updated menu item
    const updatedMenuItem = await MenuItem.findById(req.params.id);
    
    res.status(200).json({
      success: true,
      data: updatedMenuItem
    });
  });
});

/**
 * @desc    Batch create multiple menu items
 * @route   POST /api/v1/restaurants/:restaurantId/menu-items/batch
 * @access  Private (Restaurant Owner, Admin)
 */
export const batchCreateMenuItems = asyncHandler(async (req, res, next) => {
  // Verify request body is an array
  if (!Array.isArray(req.body)) {
    return next(new ErrorResponse('Request body must be an array of menu items', 400));
  }
  
  // Find restaurant to verify it exists and check ownership
  const restaurant = await Restaurant.findById(req.params.restaurantId);
  
  if (!restaurant) {
    return next(new ErrorResponse(`Restaurant not found with id of ${req.params.restaurantId}`, 404));
  }
  
  // Verify restaurant ownership
  if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to add menu items to this restaurant`,
        403
      )
    );
  }
  
  // Add restaurant ID to each item
  const menuItemsToCreate = req.body.map(item => ({
    ...item,
    restaurant: req.params.restaurantId
  }));
  
  // Create all menu items
  const menuItems = await MenuItem.insertMany(menuItemsToCreate);
  
  res.status(201).json({
    success: true,
    count: menuItems.length,
    data: menuItems
  });
});

/**
 * @desc    Toggle menu item availability
 * @route   PATCH /api/v1/restaurants/:restaurantId/menu-items/:id/toggle-availability
 * @access  Private (Restaurant Owner, Admin)
 */
export const toggleMenuItemAvailability = asyncHandler(async (req, res, next) => {
  let menuItem = await MenuItem.findById(req.params.id);
  
  if (!menuItem) {
    return next(new ErrorResponse(`Menu item not found with id of ${req.params.id}`, 404));
  }
  
  // Verify item belongs to the restaurant
  if (menuItem.restaurant.toString() !== req.params.restaurantId) {
    return next(new ErrorResponse(`Menu item not found in this restaurant`, 404));
  }
  
  // Find restaurant to check ownership
  const restaurant = await Restaurant.findById(req.params.restaurantId);
  
  // Verify restaurant ownership
  if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update menu items for this restaurant`,
        403
      )
    );
  }
  
  // Toggle availability
  menuItem = await MenuItem.findByIdAndUpdate(
    req.params.id,
    { available: !menuItem.available },
    { new: true }
  );
  
  res.status(200).json({
    success: true,
    data: menuItem
  });
});