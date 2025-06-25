// models/Restaurant.js
import mongoose from 'mongoose';
import slugify from 'slugify';

const AddressSchema = new mongoose.Schema({
  street: {
    type: String,
    required: [true, 'Street address is required']
  },
  city: {
    type: String,
    required: [true, 'City is required']
  },
  state: {
    type: String,
    required: [true, 'State is required']
  },
  zipCode: {
    type: String,
    required: [true, 'Zip code is required']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    default: 'USA'
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
    formattedAddress: String
  }
});

const OperatingHoursSchema = new mongoose.Schema({
  monday: {
    isOpen: {
      type: Boolean,
      default: true
    },
    open: {
      type: String,
      default: '09:00'
    },
    close: {
      type: String,
      default: '22:00'
    }
  },
  tuesday: {
    isOpen: {
      type: Boolean,
      default: true
    },
    open: {
      type: String,
      default: '09:00'
    },
    close: {
      type: String,
      default: '22:00'
    }
  },
  wednesday: {
    isOpen: {
      type: Boolean,
      default: true
    },
    open: {
      type: String,
      default: '09:00'
    },
    close: {
      type: String,
      default: '22:00'
    }
  },
  thursday: {
    isOpen: {
      type: Boolean,
      default: true
    },
    open: {
      type: String,
      default: '09:00'
    },
    close: {
      type: String,
      default: '22:00'
    }
  },
  friday: {
    isOpen: {
      type: Boolean,
      default: true
    },
    open: {
      type: String,
      default: '09:00'
    },
    close: {
      type: String,
      default: '23:00'
    }
  },
  saturday: {
    isOpen: {
      type: Boolean,
      default: true
    },
    open: {
      type: String,
      default: '10:00'
    },
    close: {
      type: String,
      default: '23:00'
    }
  },
  sunday: {
    isOpen: {
      type: Boolean,
      default: true
    },
    open: {
      type: String,
      default: '10:00'
    },
    close: {
      type: String,
      default: '22:00'
    }
  }
});

const RestaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a restaurant name'],
    unique: true,
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  slug: String,
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot be more than 200 characters'],
    default: function() {
      return this.description ? this.description.substring(0, 197) + '...' : '';
    }
  },
  address: AddressSchema,
  cuisine: {
    type: [String],
    required: [true, 'Please specify at least one cuisine type'],
    enum: [
      'Italian', 'Chinese', 'Japanese', 'Mexican', 'Indian', 
      'Thai', 'Mediterranean', 'American', 'French', 'Spanish', 
      'Greek', 'Korean', 'Vietnamese', 'Turkish', 'Brazilian',
      'Middle Eastern', 'African', 'Caribbean', 'German', 'British',
      'Fusion', 'Seafood', 'Vegan', 'Vegetarian', 'Bakery',
      'Dessert', 'Cafe', 'Pizza', 'Burgers', 'Breakfast',
      'Fast Food', 'Fine Dining', 'Steakhouse', 'Other'
    ]
  },
  priceRange: {
    type: String,
    enum: ['$', '$$', '$$$', '$$$$'],
    required: [true, 'Please specify a price range'],
    default: '$$'
  },
  operatingHours: {
    type: OperatingHoursSchema,
    default: () => ({})
  },
  contactInfo: {
    phone: {
      type: String,
      required: [true, 'Please provide a contact phone number'],
      match: [/^\+?[\d\s()-]{10,15}$/, 'Please provide a valid phone number']
    },
    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    website: {
      type: String,
      match: [
        /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
        'Please provide a valid URL'
      ]
    }
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
  // Restaurant features/amenities
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
    creditCardsAccepted: {
      type: Boolean,
      default: true
    },
    outdoorSeating: {
      type: Boolean,
      default: false
    },
    wifi: {
      type: Boolean,
      default: false
    },
    parking: {
      type: Boolean,
      default: false
    },
    alcohol: {
      type: String,
      enum: ['None', 'Beer & Wine', 'Full Bar'],
      default: 'None'
    },
    accessibility: {
      type: Boolean,
      default: true
    },
    liveMusic: {
      type: Boolean,
      default: false
    }
  },
  // Dietary options
  dietaryOptions: {
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
    halal: {
      type: Boolean,
      default: false
    },
    kosher: {
      type: Boolean,
      default: false
    },
    organic: {
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
      default: 0,
      set: function(val) {
        // Round to 1 decimal place
        return Math.round(val * 10) / 10;
      }
    },
    count: {
      type: Number,
      default: 0
    }
  },
  // Availability status
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'maintenance', 'closed'],
    default: 'pending'
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
  // Social media links
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    tiktok: String
  },
  // Special fields
  specialOffer: {
    hasOffer: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      maxlength: [500, 'Special offer description cannot be more than 500 characters']
    },
    validUntil: {
      type: Date
    }
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
  toObject: { virtuals: true },
  id: false
});

// Create slug from the name before saving
RestaurantSchema.pre('save', function(next) {
  // Update the updatedAt field on saves
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

// Virtual for menu items - links Restaurant to MenuItem collection
RestaurantSchema.virtual('menuItems', {
  ref: 'MenuItem',
  localField: '_id',
  foreignField: 'restaurant',
  justOne: false
});

// Method to get primary image
RestaurantSchema.methods.getPrimaryImage = function() {
  if (!this.images || this.images.length === 0) {
    return null;
  }
  
  const primaryImage = this.images.find(img => img.isPrimary);
  return primaryImage ? primaryImage.url : this.images[0].url;
};

// Method to check if restaurant is open now
RestaurantSchema.methods.isOpenNow = function() {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[now.getDay()];
  
  const dayInfo = this.operatingHours[currentDay];
  
  if (!dayInfo || !dayInfo.isOpen) {
    return false;
  }
  
  const currentTime = now.getHours() * 60 + now.getMinutes(); // convert to minutes
  
  const [openHours, openMinutes] = dayInfo.open.split(':').map(Number);
  const [closeHours, closeMinutes] = dayInfo.close.split(':').map(Number);
  
  const openTime = openHours * 60 + openMinutes;
  const closeTime = closeHours * 60 + closeMinutes;
  
  return currentTime >= openTime && currentTime <= closeTime;
};

// Add indexes for better search performance
RestaurantSchema.index({ name: 'text', description: 'text', 'cuisine': 1 });
RestaurantSchema.index({ 'address.city': 1, 'address.state': 1, 'address.country': 1 });
RestaurantSchema.index({ 'address.location.coordinates': '2dsphere' });
RestaurantSchema.index({ slug: 1 });
RestaurantSchema.index({ owner: 1 });
RestaurantSchema.index({ priceRange: 1 });
RestaurantSchema.index({ status: 1 });
RestaurantSchema.index({ featured: 1 });

const Restaurant = mongoose.model('Restaurant', RestaurantSchema);

export default Restaurant;