const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

wishlistItemSchema.index({ userEmail: 1, tour: 1 }, { unique: true });
wishlistItemSchema.index({ userEmail: 1, savedAt: -1 });

module.exports = mongoose.model('WishlistItem', wishlistItemSchema);
