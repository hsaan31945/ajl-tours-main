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
  price: {
    type: Number,
    required: true,
    min: 0
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
    trim: true,
    default: "12 hours"
  },
  tourType: {
    type: String,
    trim: true,
    default: "Day Tour, Private Tour"
  },
  reviewText: {
    type: String,
    trim: true,
    default: "No reviews yet"
  },
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

// Ensure virtual fields are serialized
tourSchema.set('toJSON', { virtuals: true });

tourSchema.index({ division: 1, isActive: 1, createdAt: -1 });
tourSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Tour', tourSchema);


