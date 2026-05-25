const mongoose = require('mongoose');
const { connectDB } = require('../lib/db');
const Tour = require('../models/Tour');
const TourHighlight = require('../models/TourHighlight');
const TourIncluded = require('../models/TourIncluded');
const TourExcluded = require('../models/TourExcluded');
const TourItinerary = require('../models/TourItinerary');

async function migrateToSeparateCollections() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    console.log('Fetching all tours...');
    const tours = await Tour.find({}).lean();
    console.log(`Found ${tours.length} tours to migrate\n`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const tour of tours) {
      try {
        const tourId = tour._id;
        let tourUpdated = false;
        
        // Migrate highlights
        if (Array.isArray(tour.highlights) && tour.highlights.length > 0) {
          const existingHighlights = await TourHighlight.find({ tourId }).countDocuments();
          if (existingHighlights === 0) {
            // Only migrate if no existing data in separate collection
            await TourHighlight.deleteMany({ tourId });
            await TourHighlight.insertMany(
              tour.highlights.map((value, index) => ({
                tourId,
                value: typeof value === 'string' ? value.trim() : String(value),
                order: index
              }))
            );
            console.log(`  ✓ Migrated ${tour.highlights.length} highlights for tour: ${tour.name || tourId}`);
            tourUpdated = true;
          } else {
            console.log(`  ⊙ Skipped highlights (already exists) for tour: ${tour.name || tourId}`);
          }
        }
        
        // Migrate included
        if (Array.isArray(tour.included) && tour.included.length > 0) {
          const existingIncluded = await TourIncluded.find({ tourId }).countDocuments();
          if (existingIncluded === 0) {
            await TourIncluded.deleteMany({ tourId });
            await TourIncluded.insertMany(
              tour.included.map((value, index) => ({
                tourId,
                value: typeof value === 'string' ? value.trim() : String(value),
                order: index
              }))
            );
            console.log(`  ✓ Migrated ${tour.included.length} included items for tour: ${tour.name || tourId}`);
            tourUpdated = true;
          } else {
            console.log(`  ⊙ Skipped included (already exists) for tour: ${tour.name || tourId}`);
          }
        }
        
        // Migrate excluded
        if (Array.isArray(tour.excluded) && tour.excluded.length > 0) {
          const existingExcluded = await TourExcluded.find({ tourId }).countDocuments();
          if (existingExcluded === 0) {
            await TourExcluded.deleteMany({ tourId });
            await TourExcluded.insertMany(
              tour.excluded.map((value, index) => ({
                tourId,
                value: typeof value === 'string' ? value.trim() : String(value),
                order: index
              }))
            );
            console.log(`  ✓ Migrated ${tour.excluded.length} excluded items for tour: ${tour.name || tourId}`);
            tourUpdated = true;
          } else {
            console.log(`  ⊙ Skipped excluded (already exists) for tour: ${tour.name || tourId}`);
          }
        }
        
        // Migrate itinerary
        if (Array.isArray(tour.itinerary) && tour.itinerary.length > 0) {
          const existingItinerary = await TourItinerary.find({ tourId }).countDocuments();
          if (existingItinerary === 0) {
            await TourItinerary.deleteMany({ tourId });
            await TourItinerary.insertMany(
              tour.itinerary.map((item, index) => ({
                tourId,
                title: item.title || '',
                description: item.description || '',
                duration: item.duration || '',
                location: item.location || '',
                activities: Array.isArray(item.activities) ? item.activities : [],
                order: index
              }))
            );
            console.log(`  ✓ Migrated ${tour.itinerary.length} itinerary items for tour: ${tour.name || tourId}`);
            tourUpdated = true;
          } else {
            console.log(`  ⊙ Skipped itinerary (already exists) for tour: ${tour.name || tourId}`);
          }
        }
        
        if (tourUpdated) {
          migratedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`  ❌ Error migrating tour ${tour._id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n✅ Migration completed!');
    console.log(`📊 Summary:`);
    console.log(`   Migrated: ${migratedCount} tours`);
    console.log(`   Skipped: ${skippedCount} tours (already migrated)`);
    console.log(`   Errors: ${errorCount} tours`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateToSeparateCollections();

