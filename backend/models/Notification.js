const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  type: {
    type: String,
    enum: ['booking_confirmation', 'payment_update', 'booking_cancellation', 'tour_update', 'support', 'account'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1200
  },
  relatedBooking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  relatedTour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour'
  },
  sourceKey: {
    type: String,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

notificationSchema.index(
  { userEmail: 1, sourceKey: 1 },
  {
    unique: true,
    partialFilterExpression: { sourceKey: { $type: 'string' } }
  }
);
notificationSchema.index({ userEmail: 1, createdAt: -1 });
notificationSchema.index({ userEmail: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
