// models/MenuItem.js
import mongoose from 'mongoose';

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
  discountedPrice: {
    type: Number,
    min: [0, 'Discounted price cannot be negative'],
    validate: {
      validator: function(val) {
        return val < this.price;
      },
      message: 'Discounted price must be less than the regular price'
    }
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
      'specialty',
      'soup',
      'salad',
      'kid\'s meal',
      'combo'
    ]
  },
  subcategory: {
    type: String
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
    },
    containsAlcohol: {
      type: Boolean,
      default: false
    }
  },
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    sodium: Number
  },
  allergens: {
    type: [String],
    enum: [
      'milk', 'eggs', 'fish', 'shellfish', 'tree nuts', 
      'peanuts', 'wheat', 'soybeans', 'sesame'
    ]
  },
  // Customization options (like add extra cheese, remove onions, etc.)
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
  availability: {
    isAvailable: {
      type: Boolean,
      default: true
    },
    availableDays: {
      monday: { type: Boolean, default: true },
      tuesday: { type: Boolean, default: true },
      wednesday: { type: Boolean, default: true },
      thursday: { type: Boolean, default: true },
      friday: { type: Boolean, default: true },
      saturday: { type: Boolean, default: true },
      sunday: { type: Boolean, default: true }
    },
    limitedTimeOnly: {
      isLimited: {
        type: Boolean,
        default: false
      },
      startDate: Date,
      endDate: Date
    }
  },
  popularity: {
    type: Number,
    min: 0,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  // Restaurant reference - links each menu item to a specific restaurant
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  // Order of item in the menu (for sorting)
  displayOrder: {
    type: Number,
    default: 0
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

// Check if item is currently available
MenuItemSchema.methods.isAvailableNow = function() {
  if (!this.availability.isAvailable) {
    return false;
  }
  
  // Check if it's a limited time item
  if (this.availability.limitedTimeOnly.isLimited) {
    const now = new Date();
    const startDate = this.availability.limitedTimeOnly.startDate;
    const endDate = this.availability.limitedTimeOnly.endDate;
    
    if (startDate && now < startDate) {
      return false;
    }
    
    if (endDate && now > endDate) {
      return false;
    }
  }
  
  // Check if available on current day
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[new Date().getDay()];
  
  return this.availability.availableDays[currentDay];
};

// Add index for better search performance
MenuItemSchema.index({ name: 'text', description: 'text' });
MenuItemSchema.index({ category: 1, subcategory: 1 });
MenuItemSchema.index({ restaurant: 1 });
MenuItemSchema.index({ 'availability.isAvailable': 1 });
MenuItemSchema.index({ featured: 1 });
MenuItemSchema.index({ price: 1 });
MenuItemSchema.index({ displayOrder: 1 });

const MenuItem = mongoose.model('MenuItem', MenuItemSchema);

export default MenuItem;