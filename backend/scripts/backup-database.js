const mongoose = require('mongoose');
const { connectDB } = require('../lib/db');
const Tour = require('../models/Tour');
const TourHighlight = require('../models/TourHighlight');
const TourIncluded = require('../models/TourIncluded');
const TourExcluded = require('../models/TourExcluded');
const TourItinerary = require('../models/TourItinerary');
const fs = require('fs');
const path = require('path');

// Create backups directory if it doesn't exist
const backupsDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

async function backupDatabase() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                     new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];
    const backupDir = path.join(backupsDir, `backup_${timestamp}`);
    fs.mkdirSync(backupDir, { recursive: true });
    
    console.log('Backing up tours...');
    const tours = await Tour.find({}).lean();
    fs.writeFileSync(
      path.join(backupDir, 'tours.json'),
      JSON.stringify(tours, null, 2)
    );
    console.log(`✓ Backed up ${tours.length} tours`);
    
    console.log('Backing up tour highlights...');
    const highlights = await TourHighlight.find({}).lean();
    fs.writeFileSync(
      path.join(backupDir, 'tourHighlights.json'),
      JSON.stringify(highlights, null, 2)
    );
    console.log(`✓ Backed up ${highlights.length} tour highlights`);
    
    console.log('Backing up tour included...');
    const included = await TourIncluded.find({}).lean();
    fs.writeFileSync(
      path.join(backupDir, 'tourIncluded.json'),
      JSON.stringify(included, null, 2)
    );
    console.log(`✓ Backed up ${included.length} tour included items`);
    
    console.log('Backing up tour excluded...');
    const excluded = await TourExcluded.find({}).lean();
    fs.writeFileSync(
      path.join(backupDir, 'tourExcluded.json'),
      JSON.stringify(excluded, null, 2)
    );
    console.log(`✓ Backed up ${excluded.length} tour excluded items`);
    
    console.log('Backing up tour itinerary...');
    const itinerary = await TourItinerary.find({}).lean();
    fs.writeFileSync(
      path.join(backupDir, 'tourItinerary.json'),
      JSON.stringify(itinerary, null, 2)
    );
    console.log(`✓ Backed up ${itinerary.length} tour itinerary items`);
    
    // Create a summary file
    const summary = {
      timestamp: new Date().toISOString(),
      backupDirectory: backupDir,
      counts: {
        tours: tours.length,
        highlights: highlights.length,
        included: included.length,
        excluded: excluded.length,
        itinerary: itinerary.length
      }
    };
    
    fs.writeFileSync(
      path.join(backupDir, 'backup-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    console.log('\n✅ Backup completed successfully!');
    console.log(`📁 Backup location: ${backupDir}`);
    console.log('\nSummary:');
    console.log(JSON.stringify(summary.counts, null, 2));
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Backup failed:', error);
    process.exit(1);
  }
}

backupDatabase();

