// models/Restaurant.js
const mongoose = require('mongoose');
const slugify = require('slugify');
const geocoder = require('../utils/geocoder');

const RestaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a restaurant name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  slug: String,
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  website: {
    type: String,
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      'Please use a valid URL with HTTP or HTTPS'
    ]
  },
  phone: {
    type: String,
    maxlength: [20, 'Phone number cannot be longer than 20 characters']
  },
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  location: {
    // GeoJSON Point
    type: {
      type: String,
      enum: ['Point']
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
    required: [true, 'Please add at least one cuisine type'],
    enum: [
      'italian',
      'chinese',
      'indian',
      'japanese',
      'mexican',
      'thai',
      'american',
      'mediterranean',
      'french',
      'vietnamese',
      'korean',
      'spanish',
      'middle-eastern',
      'greek',
      'vegan',
      'vegetarian',
      'seafood',
      'steakhouse',
      'pizza',
      'fast-food',
      'dessert',
      'cafe',
      'bakery',
      'other'
    ]
  },
  averageRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  averageCost: {
    type: Number
  },
  photo: {
    type: String,
    default: 'no-photo.jpg'
  },
  delivery: {
    type: Boolean,
    default: false
  },
  takeout: {
    type: Boolean,
    default: true
  },
  dineIn: {
    type: Boolean,
    default: true
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
  // Owner reference - links to User model
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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

// Create restaurant slug from the name
RestaurantSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Update the updatedAt field on saves
RestaurantSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Geocode & create location field
RestaurantSchema.pre('save', async function(next) {
  const loc = await geocoder.geocode(this.address);
  this.location = {
    type: 'Point',
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
    street: loc[0].streetName,
    city: loc[0].city,
    state: loc[0].stateCode,
    zipcode: loc[0].zipcode,
    country: loc[0].countryCode
  };

  // Do not save address in DB
  this.address = undefined;
  next();
});

// Cascade delete menu items when a restaurant is deleted
RestaurantSchema.pre('remove', async function(next) {
  await this.model('MenuItem').deleteMany({ restaurant: this._id });
  next();
});

// Reverse populate with virtuals
RestaurantSchema.virtual('menu', {
  ref: 'MenuItem',
  localField: '_id',
  foreignField: 'restaurant',
  justOne: false
});

RestaurantSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'restaurant',
  justOne: false
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);