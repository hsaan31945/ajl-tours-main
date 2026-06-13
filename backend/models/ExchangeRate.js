const mongoose = require('mongoose');

const exchangeRateSchema = new mongoose.Schema({
  base: {
    type: String,
    default: 'CHF',
    uppercase: true,
    trim: true,
    index: true,
    unique: true,
  },
  rates: {
    type: Map,
    of: Number,
    required: true,
    default: {},
  },
  provider: {
    type: String,
    trim: true,
    default: '',
  },
  fetchedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.models.ExchangeRate || mongoose.model('ExchangeRate', exchangeRateSchema);
