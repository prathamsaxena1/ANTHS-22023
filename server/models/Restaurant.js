// models/Restaurant.js
const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a restaurant name'],
    unique: true,
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  location: {
    // GeoJSON Point
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    },
    formattedAddress: String,
    street: String,
    city: String,
    state: String,
    zipcode: String,
    country: String
  },
  cuisine: {
    type: [String],
    required: [true, 'Please specify at least one cuisine type']
  },
  priceRange: {
    type: String,
    enum: ['$', '$$', '$$$', '$$$$'],
    required: [true, 'Please specify a price range']
  },
  openingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  contactInfo: {
    phone: {
      type: String,
      required: [true, 'Please provide a contact phone number']
    },
    email: {
      type: String,
      match: [
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
        'Please provide a valid email'
      ]
    },
    website: String
  },
  // Images array - can store URLs or file paths
  images: {
    type: [{
      url: {
        type: String,
        required: true
      },
      caption: {
        type: String
      },
      isPrimary: {
        type: Boolean,
        default: false
      }
    }],
    validate: [
      {
        validator: function(images) {
          // Ensure at least one image is marked as primary if there are images
          if (images.length > 0) {
            return images.some(img => img.isPrimary === true);
          }
          return true; // When no images, validation passes
        },
        message: 'At least one image must be marked as primary'
      },
      {
        validator: function(images) {
          // Count primary images
          const primaryCount = images.filter(img => img.isPrimary).length;
          return primaryCount <= 1;
        },
        message: 'Only one image can be marked as primary'
      }
    ]
  },
  // Additional features
  features: {
    delivery: {
      type: Boolean,
      default: false
    },
    takeout: {
      type: Boolean,
      default: true
    },
    reservationRequired: {
      type: Boolean,
      default: false
    },
    outdoorSeating: {
      type: Boolean,
      default: false
    },
    vegetarianOptions: {
      type: Boolean,
      default: false
    },
    veganOptions: {
      type: Boolean,
      default: false
    },
    glutenFreeOptions: {
      type: Boolean,
      default: false
    }
  },
  // Rating and reviews
  rating: {
    average: {
      type: Number,
      min: [0, 'Rating must be at least 0'],
      max: [5, 'Rating must not be more than 5'],
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  // Availability status
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'maintenance'],
    default: 'inactive'
  },
  // Owner reference - links to User model
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Administrative fields
  featured: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified'],
    default: 'unverified'
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add virtual property for menus
RestaurantSchema.virtual('menuItems', {
  ref: 'MenuItem',
  localField: '_id',
  foreignField: 'restaurant',
  justOne: false
});

// Update the updatedAt field on saves
RestaurantSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add index for better search performance
RestaurantSchema.index({ name: 'text', description: 'text' });
RestaurantSchema.index({ 'location.city': 1, 'location.country': 1 });
RestaurantSchema.index({ cuisine: 1 });

module.exports = mongoose.model('Restaurant', RestaurantSchema);