/**
 * AJL Tours - Database Import/Restore Utility
 * Imports JSON data exported by export_db.ps1 into any new MongoDB database.
 * 
 * Usage:
 *   node scripts/import_db.js --uri "your_mongodb_connection_uri" --folder "../database-backups/db_export_20260518_235523"
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Define inline schemas to support direct running without workspace dependencies
const DivisionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  bannerImage: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const TourSchema = new mongoose.Schema({
  division: { type: mongoose.Schema.Types.ObjectId, ref: 'Division', required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  startLocation: { type: String, required: true },
  endLocation: { type: String, required: true },
  routeDetails: String,
  minTicketsPerBooking: { type: Number, default: 1 },
  maxTotalTickets: Number,
  images: [String],
  isActive: { type: Boolean, default: true },
  metadata: { type: Object, default: {} },
  itinerary: [{
    title: String,
    description: String,
    duration: String,
    location: String,
    activities: [String]
  }],
  datePrices: { type: Map, of: Number, default: {} },
  duration: String,
  tourType: String,
  reviewText: String,
  highlights: [String],
  included: [String],
  excluded: [String],
  overview: String,
  pickupLocations: [{ name: String, description: String }]
}, { timestamps: true });

const BookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  travelers: { type: Number, required: true },
  specialRequests: String,
  tourTitle: { type: String, required: true },
  tourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour' },
  totalPrice: { type: Number, required: true },
  tripDate: { type: Date, required: true },
  address: String,
  location: { lat: Number, lng: Number },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  stripePaymentId: String
}, { timestamps: true });

// Parse command line arguments
const args = {};
process.argv.slice(2).forEach(arg => {
  if (arg.startsWith('--')) {
    const index = arg.indexOf('=');
    if (index !== -1) {
      const key = arg.substring(2, index);
      const val = arg.substring(index + 1);
      args[key] = val;
    } else {
      const key = arg.substring(2);
      args[key] = true;
    }
  }
});

const mongoURI = args.uri;
const exportFolder = args.folder;

if (!mongoURI || !exportFolder) {
  console.error('\n❌ Missing arguments!');
  console.log('\nUsage:');
  console.log('  node scripts/import_db.js --uri="<connection_uri>" --folder="<export_folder_path>"\n');
  process.exit(1);
}

// Convert serialized MongoDB Extended JSON values to standard JS types (e.g. ObjectId, Date)
function cleanData(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => cleanData(item));
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    // 1. Resolve $oid strings or sub-objects to standard Mongoose ObjectIds
    if (value && typeof value === 'object' && value.$oid) {
      cleaned[key] = new mongoose.Types.ObjectId(value.$oid);
    } 
    else if (key === '_id' && typeof value === 'string') {
      cleaned[key] = new mongoose.Types.ObjectId(value);
    }
    else if (key === 'division' && typeof value === 'string') {
      cleaned[key] = new mongoose.Types.ObjectId(value);
    }
    else if (key === 'tourId' && typeof value === 'string') {
      cleaned[key] = new mongoose.Types.ObjectId(value);
    }
    // 2. Resolve $date Extended JSON strings to standard JS Date objects
    else if (value && typeof value === 'object' && value.$date) {
      cleaned[key] = new Date(value.$date);
    }
    else if (value && typeof value === 'object') {
      cleaned[key] = cleanData(value);
    }
    else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// Helper to read JSON files safely, stripping any Byte Order Marks (BOM) or null characters from PowerShell
function readJSONFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Strip BOM if present
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  // Strip BOM regex and null bytes
  content = content.replace(/^\uFEFF/, '').replace(/\0/g, '').trim();
  return JSON.parse(content);
}

async function run() {
  const targetDir = path.resolve(exportFolder);
  if (!fs.existsSync(targetDir)) {
    console.error(`❌ Export folder not found: "${targetDir}"`);
    process.exit(1);
  }

  console.log(`🔌 Connecting to target MongoDB: ${mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('✅ Connected successfully!');

  const Division = mongoose.models.Division || mongoose.model('Division', DivisionSchema);
  const Tour = mongoose.models.Tour || mongoose.model('Tour', TourSchema);
  const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

  // 1. Import Divisions
  const divisionsFile = path.join(targetDir, 'divisions.json');
  if (fs.existsSync(divisionsFile)) {
    console.log('\n📂 Importing Divisions...');
    const data = readJSONFile(divisionsFile);
    const records = cleanData(Array.isArray(data) ? data : [data]);
    
    let imported = 0;
    for (const record of records) {
      // Upsert by _id to prevent duplicate keys if running multiple times
      await Division.updateOne({ _id: record._id }, { $set: record }, { upsert: true });
      imported++;
    }
    console.log(`✅ Success: Imported/Updated ${imported} divisions.`);
  }

  // 2. Import Tours
  const toursFile = path.join(targetDir, 'tours_detailed.json');
  if (fs.existsSync(toursFile)) {
    console.log('\n📂 Importing Tours (Detailed)...');
    const data = readJSONFile(toursFile);
    const records = cleanData(Array.isArray(data) ? data : [data]);
    
    let imported = 0;
    for (const record of records) {
      // Ensure the division reference is stored as a direct ObjectId, not a populated object
      if (record.division && typeof record.division === 'object' && record.division._id) {
        record.division = record.division._id;
      }
      // Remove populated virtual properties before inserting
      delete record.divisionName;
      delete record.id;

      await Tour.updateOne({ _id: record._id }, { $set: record }, { upsert: true });
      imported++;
    }
    console.log(`✅ Success: Imported/Updated ${imported} tours.`);
  }

  // 3. Import Bookings
  const bookingsFile = path.join(targetDir, 'bookings.json');
  if (fs.existsSync(bookingsFile)) {
    console.log('\n📂 Importing Bookings...');
    const data = readJSONFile(bookingsFile);
    const records = cleanData(Array.isArray(data) ? data : [data]);
    
    let imported = 0;
    for (const record of records) {
      await Booking.updateOne({ _id: record._id }, { $set: record }, { upsert: true });
      imported++;
    }
    console.log(`✅ Success: Imported/Updated ${imported} bookings.`);
  }

  console.log('\n==========================================');
  console.log('🎉 Migration completed successfully!');
  console.log('==========================================\n');
  
  await mongoose.connection.close();
}

run().catch(err => {
  console.error('\n❌ Migration failed:', err);
  mongoose.connection.close();
  process.exit(1);
});
