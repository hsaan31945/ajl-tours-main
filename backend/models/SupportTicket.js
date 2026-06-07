const crypto = require('crypto');
const mongoose = require('mongoose');

const supportReplySchema = new mongoose.Schema({
  authorType: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  authorName: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 3000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const supportTicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
    index: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 180
  },
  category: {
    type: String,
    enum: ['booking', 'payment', 'tour', 'account', 'refund', 'other'],
    default: 'other'
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 3000
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  replies: [supportReplySchema]
}, {
  timestamps: true
});

supportTicketSchema.pre('validate', function setTicketNumber(next) {
  if (!this.ticketNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.ticketNumber = `AJL-${timestamp}-${suffix}`;
  }
  next();
});

supportTicketSchema.index({ userEmail: 1, createdAt: -1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
