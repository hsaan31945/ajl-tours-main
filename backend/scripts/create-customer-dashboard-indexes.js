require('dotenv').config();

const mongoose = require('mongoose');
const config = require('../config');
const Notification = require('../models/Notification');
const SupportTicket = require('../models/SupportTicket');
const WishlistItem = require('../models/WishlistItem');

const run = async () => {
  if (!config.mongodb.uri) {
    throw new Error('MONGODB_URI is required to create dashboard indexes');
  }

  await mongoose.connect(config.mongodb.uri);
  await Promise.all([
    Notification.init(),
    SupportTicket.init(),
    WishlistItem.init()
  ]);

  console.log('Customer dashboard indexes are ready.');
};

run()
  .catch((error) => {
    console.error('Failed to create customer dashboard indexes:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
