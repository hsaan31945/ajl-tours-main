const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Tour = require('../models/Tour');
const Division = require('../models/Division');
const Booking = require('../models/Booking');
const HomepageContent = require('../models/HomepageContent');
require('dotenv').config();

async function backupDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }

  await mongoose.connect(uri);

  const backupDir = path.join(__dirname, '..', 'backups', `backup-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  fs.mkdirSync(backupDir, { recursive: true });

  const collections = {
    tours: await Tour.find({}).lean(),
    divisions: await Division.find({}).lean(),
    bookings: await Booking.find({}).lean(),
    homepageContent: await HomepageContent.find({}).lean(),
  };

  for (const [name, records] of Object.entries(collections)) {
    fs.writeFileSync(path.join(backupDir, `${name}.json`), JSON.stringify(records, null, 2));
  }

  await mongoose.connection.close();
  console.log(`Backup written to ${backupDir}`);
}

backupDatabase().catch(async (error) => {
  console.error('Backup failed:', error);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
