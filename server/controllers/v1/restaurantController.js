// controllers/v1/restaurantController.js
const Restaurant = require('../../models/Restaurant');
const MenuItem = require('../../models/MenuItem');
const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../middleware/asyncHandler');

// @desc    Get all restaurants
// @route   GET /api/v1/restaurants
// @access  Public
export const getRestaurants = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single restaurant
// @route   GET /api/v1/restaurants/:id
// @access  Public
export const getRestaurant = asyncHandler(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    return next(
      new ErrorResponse(`Restaurant not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: restaurant
  });
});

// @desc    Create new restaurant
// @route   POST /api/v1/restaurants
// @access  Private (Restaurant Owner, Admin)
export const createRestaurant = asyncHandler(async (req, res, next) => {
  // Add owner to req.body
  req.body.owner = req.user.id;

  // Check for existing restaurant with same name
  const existingRestaurant = await Restaurant.findOne({ name: req.body.name });

  if (existingRestaurant) {
    return next(
      new ErrorResponse(`Restaurant with name "${req.body.name}" already exists`, 400)
    );
  }

  const restaurant = await Restaurant.create(req.body);

  res.status(201).json({
    success: true,
    data: restaurant
  });
});

// @desc    Update restaurant
// @route   PUT /api/v1/restaurants/:restaurantId
// @access  Private (Restaurant Owner, Admin)
export const updateRestaurant = asyncHandler(async (req, res, next) => {
  let restaurant = await Restaurant.findById(req.params.restaurantId);

  if (!restaurant) {
    return next(
      new ErrorResponse(`Restaurant not found with id of ${req.params.restaurantId}`, 404)
    );
  }

  // Ensure user is restaurant owner
  if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to update this restaurant`, 403)
    );
  }

  restaurant = await Restaurant.findByIdAndUpdate(req.params.restaurantId, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: restaurant
  });
});

// @desc    Delete restaurant
// @route   DELETE /api/v1/restaurants/:restaurantId
// @access  Private (Restaurant Owner, Admin)
export const deleteRestaurant = asyncHandler(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.restaurantId);

  if (!restaurant) {
    return next(
      new ErrorResponse(`Restaurant not found with id of ${req.params.restaurantId}`, 404)
    );
  }

  // Ensure user is restaurant owner
  if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to delete this restaurant`, 403)
    );
  }

  // Delete all menu items associated with the restaurant
  await MenuItem.deleteMany({ restaurant: req.params.restaurantId });

  // Delete the restaurant
  await restaurant.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload restaurant image
// @route   POST /api/v1/restaurants/:restaurantId/upload
// @access  Private (Restaurant Owner, Admin)
export const uploadRestaurantImage = asyncHandler(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.restaurantId);

  if (!restaurant) {
    return next(
      new ErrorResponse(`Restaurant not found with id of ${req.params.restaurantId}`, 404)
    );
  }

  // Ensure user is restaurant owner
  if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to update this restaurant`, 403)
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
  file.name = `photo_${restaurant._id}_${Date.now()}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/restaurants/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    // Add to images array with isPrimary set to true if it's the first image
    const newImage = {
      url: `/uploads/restaurants/${file.name}`,
      caption: req.body.caption || file.name,
      isPrimary: restaurant.images.length === 0 ? true : req.body.isPrimary || false
    };

    // If this is set to primary, make sure others are not primary
    if (newImage.isPrimary && restaurant.images.length > 0) {
      restaurant.images.forEach(image => {
        image.isPrimary = false;
      });
    }

    restaurant.images.push(newImage);
    await restaurant.save();

    res.status(200).json({
      success: true,
      data: restaurant
    });
  });
});

// @desc    Get restaurant menu items
// @route   GET /api/v1/restaurants/:id/menu
// @access  Public
export const getRestaurantMenuItems = asyncHandler(async (req, res, next) => {
  // Get menu items for a specific restaurant
  const menuItems = await MenuItem.find({ restaurant: req.params.id });

  res.status(200).json({
    success: true,
    count: menuItems.length,
    data: menuItems
  });
});