const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  division: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  bookingSummary: {
    type: String,
    trim: true,
    maxlength: 400
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'CHF',
    uppercase: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  startLocation: {
    type: String,
    required: true,
    trim: true
  },
  endLocation: {
    type: String,
    required: true,
    trim: true
  },
  routeDetails: {
    type: String,
    trim: true
  },
  minTicketsPerBooking: {
    type: Number,
    default: 1,
    min: 1
  },
  maxTotalTickets: {
    type: Number,
    min: 1
  },
  // Stored image URLs/data URLs belong to the MongoDB tour document, not to a title-derived folder.
  // Renaming a tour must never change or regenerate this array.
  images: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Object,
    default: {}
  },
  itinerary: [{
    title: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    duration: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      trim: true
    },
    activities: [{
      type: String,
      trim: true
    }]
  }],
  datePrices: {
    type: Map,
    of: Number,
    default: {}
  },
  duration: {
    type: String,
    trim: true
  },
  tourType: {
    type: String,
    trim: true
  },
  reviewText: {
    type: String,
    trim: true
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true,
      trim: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  highlights: [{
    type: String,
    trim: true
  }],
  included: [{
    type: String,
    trim: true
  }],
  excluded: [{
    type: String,
    trim: true
  }],
  overview: {
    type: String,
    trim: true
  },
  pickupLocations: [{
    name: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    }
  }]
}, {
  timestamps: true
});

// Virtual for division name
tourSchema.virtual('divisionName', {
  ref: 'Division',
  localField: 'division',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields and Map fields are serialized consistently for the frontend.
tourSchema.set('toJSON', { virtuals: true, flattenMaps: true });
tourSchema.set('toObject', { virtuals: true, flattenMaps: true });

tourSchema.index({ division: 1, isActive: 1, createdAt: -1 });
tourSchema.index({ isActive: 1, createdAt: -1 });
tourSchema.index({ 'metadata.staticId': 1 }, { sparse: true });

module.exports = mongoose.model('Tour', tourSchema);
