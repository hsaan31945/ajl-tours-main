const mongoose = require('mongoose');

const homepageContentSchema = new mongoose.Schema({
  section: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

homepageContentSchema.index({ section: 1, isActive: 1 });

module.exports = mongoose.model('HomepageContent', homepageContentSchema);

