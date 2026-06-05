const mongoose = require('mongoose');
const Tour = require('../models/Tour');
const config = require('../lib/config');

async function migrateGroupDiscountFields() {
  const mongoUri = config.mongodb?.uri || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(mongoUri);

  const result = await Tour.updateMany(
    { groupDiscountEnabled: { $exists: false } },
    {
      $set: { groupDiscountEnabled: false },
    }
  );

  await Tour.updateMany(
    { groupDiscountEnabled: { $ne: true } },
    {
      $set: {
        groupDiscount4: null,
        groupDiscount5: null,
        groupDiscount6Plus: null,
      },
    }
  );

  console.log(`Group discount migration matched ${result.matchedCount || result.n} tours and updated ${result.modifiedCount || result.nModified || 0}.`);
}

migrateGroupDiscountFields()
  .catch((error) => {
    console.error('Group discount migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
