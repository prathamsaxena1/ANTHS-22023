// models/MenuItem.js
import mongoose from 'mongoose';
import slugify from 'slugify';

const MenuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for this menu item'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  slug: String,
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true,
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
      'special',
      'soup',
      'salad',
      'seafood',
      'pasta',
      'pizza',
      'sandwich',
      'sushi',
      'vegetarian',
      'vegan',
      'grill',
      'bakery',
      'snack',
      'kids'
    ]
  },
  image: {
    url: {
      type: String,
      default: 'https://res.cloudinary.com/restaurant-app/image/upload/v1623456789/default-food_jkl123.jpg'
    },
    alt: {
      type: String,
      default: function() {
        return `${this.name} - Menu Item`;
      }
    }
  },
  // Restaurant reference - links to Restaurant model
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Menu item must belong to a restaurant']
  },
  // Optional fields for enhanced functionality
  isAvailable: {
    type: Boolean,
    default: true
  },
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isVegan: {
    type: Boolean,
    default: false
  },
  isGlutenFree: {
    type: Boolean,
    default: false
  },
  isSpicy: {
    type: Boolean,
    default: false
  },
  allergens: {
    type: [String],
    enum: [
      'peanuts', 
      'tree nuts', 
      'dairy', 
      'eggs', 
      'wheat', 
      'soy', 
      'fish', 
      'shellfish', 
      'sesame'
    ]
  },
  calories: {
    type: Number,
    min: [0, 'Calories cannot be negative']
  },
  preparationTime: {
    type: Number,
    min: [0, 'Preparation time cannot be negative'],
    description: 'Preparation time in minutes'
  },
  // Options for customization
  options: [{
    name: {
      type: String,
      required: true
    },
    additionalPrice: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Additional price cannot be negative']
    }
  }],
  // Popularity tracking
  orderCount: {
    type: Number,
    default: 0,
    min: [0, 'Order count cannot be negative']
  },
  featured: {
    type: Boolean,
    default: false
  },
  discountPercentage: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%'],
    default: 0
  },
  // Timestamps for auditing
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

// Create virtual property for discounted price
MenuItemSchema.virtual('discountedPrice').get(function() {
  if (!this.discountPercentage) return this.price;
  return this.price - (this.price * this.discountPercentage / 100);
});

// Create slug from the name
MenuItemSchema.pre('save', function(next) {
  // Update timestamp on save
  this.updatedAt = Date.now();
  
  // Create slug from name
  if (this.name) {
    this.slug = slugify(this.name, {
      lower: true,
      remove: /[*+~.()'"!:@]/g
    });
  }
  next();
});

// Add index for better search performance
MenuItemSchema.index({ name: 'text', description: 'text' });
MenuItemSchema.index({ restaurant: 1 });
MenuItemSchema.index({ category: 1 });
MenuItemSchema.index({ price: 1 });
MenuItemSchema.index({ slug: 1 });
MenuItemSchema.index({ featured: 1 });

// Method to check if an item is discounted
MenuItemSchema.methods.isDiscounted = function() {
  return this.discountPercentage > 0;
};

// Middleware for automatically generating a default image alt text if not provided
MenuItemSchema.pre('validate', function(next) {
  if (this.image && !this.image.alt) {
    this.image.alt = `${this.name} - Menu Item`;
  }
  next();
});

const MenuItem = mongoose.model('MenuItem', MenuItemSchema);

export default MenuItem;