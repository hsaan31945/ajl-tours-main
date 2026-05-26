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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);

