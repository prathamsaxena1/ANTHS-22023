// controllers/v1/menuItemController.js
const MenuItem = require('../../models/MenuItem');
const Restaurant = require('../../models/Restaurant');
const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/asyncHandler');
const path = require('path');

// @desc    Get all menu items
// @route   GET /api/v1/menu-items
// @route   GET /api/v1/restaurants/:restaurantId/menu-items
// @access  Public
exports.getMenuItems = asyncHandler(async (req, res, next) => {
  // Check if we're getting menu items for a specific restaurant
  if (req.params.restaurantId) {
    const menuItems = await MenuItem.find({ restaurant: req.params.restaurantId });

    return res.status(200).json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } else {
    // Get all menu items with advanced filtering
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single menu item
// @route   GET /api/v1/menu-items/:id
// @access  Public
exports.getMenuItem = asyncHandler(async (req, res, next) => {
  const menuItem = await MenuItem.findById(req.params.itemId).populate('restaurant');

  if (!menuItem) {
    return next(
      new ErrorResponse(`Menu item not found with id of ${req.params.itemId}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: menuItem
  });
});

// @desc    Create new menu item
// @route   POST /api/v1/restaurants/:restaurantId/menu-items
// @access  Private (Restaurant Owner, Admin)
exports.createMenuItem = asyncHandler(async (req, res, next) => {
  // Add restaurant ID to req.body
  req.body.restaurant = req.params.restaurantId;
  
  // Verify restaurant exists
  const restaurant = await Restaurant.findById(req.params.restaurantId);
  
  if (!restaurant) {
    return next(
      new ErrorResponse(`Restaurant not found with id of ${req.params.restaurantId}`, 404)
    );
  }
  
  // Ensure user is restaurant owner
  if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to add a menu item to this restaurant`, 403)
    );
  }

  const menuItem = await MenuItem.create(req.body);

  res.status(201).json({
    success: true,
    data: menuItem
  });
});

// @desc    Update menu item
// @route   PUT /api/v1/restaurants/:restaurantId/menu-items/:itemId
// @access  Private (Restaurant Owner, Admin)
exports.updateMenuItem = asyncHandler(async (req, res, next) => {
  let menuItem = await MenuItem.findById(req.params.itemId);

  if (!menuItem) {
    return next(
      new ErrorResponse(`Menu item not found with id of ${req.params.itemId}`, 404)
    );
  }

  // Make sure menu item belongs to the restaurant or user is admin
  if (menuItem.restaurant.toString() !== req.params.restaurantId) {
    return next(
      new ErrorResponse(`Menu item does not belong to this restaurant`, 400)
    );
  }

  // Find restaurant to check ownership
  const restaurant = await Restaurant.findById(req.params.restaurantId);

  // Ensure user is restaurant owner
  if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to update menu items for this restaurant`, 403)
    );
  }

  // Update menu item
  menuItem = await MenuItem.findByIdAndUpdate(req.params.itemId, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: menuItem
  });
});

// @desc    Delete menu item
// @route   DELETE /api/v1/restaurants/:restaurantId/menu-items/:itemId
// @access  Private (Restaurant Owner, Admin)
exports.deleteMenuItem = asyncHandler(async (req, res, next) => {
  const menuItem = await MenuItem.findById(req.params.itemId);

  if (!menuItem) {
    return next(
      new ErrorResponse(`Menu item not found with id of ${req.params.itemId}`, 404)
    );
  }

  // Make sure menu item belongs to the restaurant
  if (menuItem.restaurant.toString() !== req.params.restaurantId) {
    return next(
      new ErrorResponse(`Menu item does not belong to this restaurant`, 400)
    );
  }

  // Find restaurant to check ownership
  const restaurant = await Restaurant.findById(req.params.restaurantId);

  // Ensure user is restaurant owner
  if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to delete menu items for this restaurant`, 403)
    );
  }

  // Delete the menu item
  await menuItem.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload menu item image
// @route   POST /api/v1/restaurants/:restaurantId/menu-items/:itemId/upload
// @access  Private (Restaurant Owner, Admin)
exports.uploadMenuItemImage = asyncHandler(async (req, res, next) => {
  const menuItem = await MenuItem.findById(req.params.itemId);

  if (!menuItem) {
    return next(
      new ErrorResponse(`Menu item not found with id of ${req.params.itemId}`, 404)
    );
  }

  // Make sure menu item belongs to the restaurant
  if (menuItem.restaurant.toString() !== req.params.restaurantId) {
    return next(
      new ErrorResponse(`Menu item does not belong to this restaurant`, 400)
    );
  }

  // Find restaurant to check ownership
  const restaurant = await Restaurant.findById(req.params.restaurantId);

  // Ensure user is restaurant owner
  if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to update menu items for this restaurant`, 403)
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = req.files.file;

  // Make sure the image is a photo
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Please upload an image file`, 400));
  }

  // Check filesize
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${process.env.MAX_FILE_UPLOAD / 1000000}MB`,
        400
      )
    );
  }

  // Create custom filename
  file.name = `menu_${menuItem._id}_${Date.now()}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/menu-items/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    // Update the menu item with image URL
    await MenuItem.findByIdAndUpdate(req.params.itemId, {
      image: {
        url: `/uploads/menu-items/${file.name}`,
        alt: req.body.alt || menuItem.name
      }
    });

    // Fetch updated menu item
    const updatedMenuItem = await MenuItem.findById(req.params.itemId);

    res.status(200).json({
      success: true,
      data: updatedMenuItem
    });
  });
});