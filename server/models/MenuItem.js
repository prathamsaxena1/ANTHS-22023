// models/MenuItem.js
const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a menu item name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please specify the price'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Please specify a category'],
    enum: [
      'appetizer', 
      'main course', 
      'dessert', 
      'beverage', 
      'side', 
      'breakfast', 
      'lunch', 
      'dinner', 
      'special'
    ]
  },
  image: {
    url: {
      type: String,
      required: [true, 'Please add an image URL']
    },
    alt: {
      type: String,
      default: 'Menu item image'
    }
  },
  dietaryInfo: {
    vegetarian: {
      type: Boolean,
      default: false
    },
    vegan: {
      type: Boolean,
      default: false
    },
    glutenFree: {
      type: Boolean,
      default: false
    },
    dairyFree: {
      type: Boolean,
      default: false
    },
    nutFree: {
      type: Boolean,
      default: false
    },
    spicy: {
      type: Boolean,
      default: false
    }
  },
  // Related customization options
  customizationOptions: [{
    name: {
      type: String,
      required: true
    },
    choices: [{
      name: {
        type: String,
        required: true
      },
      priceAdjustment: {
        type: Number,
        default: 0
      }
    }]
  }],
  // Availability fields
  available: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  // Restaurant reference
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
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

// Update the updatedAt field on saves
MenuItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add index for better search performance
MenuItemSchema.index({ name: 'text', description: 'text' });
MenuItemSchema.index({ category: 1 });
MenuItemSchema.index({ restaurant: 1 });

module.exports = mongoose.model('MenuItem', MenuItemSchema);