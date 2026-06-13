const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  phone: {
    type: String,
    trim: true
  },
  travelers: {
    type: Number,
    required: true,
    min: 1
  },
  specialRequests: {
    type: String,
    trim: true
  },
  tourTitle: {
    type: String,
    required: true,
    trim: true
  },
  tourId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour'
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  unitPrice: {
    type: Number,
    min: 0
  },
  originalUnitPrice: {
    type: Number,
    min: 0
  },
  discountUnitPrice: {
    type: Number,
    min: 0
  },
  groupDiscountTier: {
    type: String,
    enum: ['4', '5', '6Plus', null],
    default: null
  },
  groupDiscountUnitAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  groupDiscountTotal: {
    type: Number,
    min: 0,
    default: 0
  },
  groupDiscountPercent: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  paymentCurrency: {
    type: String,
    default: 'CHF',
    uppercase: true,
    trim: true
  },
  minTicketsAtBooking: {
    type: Number,
    min: 1
  },
  flexibility: {
    type: String,
    enum: ['standard', 'upgrade'],
    default: 'standard'
  },
  tripDate: {
    type: Date,
    required: true
  },
  address: {
    type: String,
    trim: true
  },
  location: {
    lat: {
      type: Number
    },
    lng: {
      type: Number
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  stripePaymentId: {
    type: String,
    trim: true
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  cancelledAt: {
    type: Date
  },
  cancelledBy: {
    type: String,
    enum: ['customer', 'admin', null],
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
