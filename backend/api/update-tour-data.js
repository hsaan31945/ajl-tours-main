const Tour = require('../../models/Tour');
const TourHighlight = require('../../models/TourHighlight');
const TourIncluded = require('../../models/TourIncluded');
const TourExcluded = require('../../models/TourExcluded');
const TourItinerary = require('../../models/TourItinerary');
const { connectDB } = require('../../lib/db');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
    
    // Parse action from query or body
    const action = req.query.action || req.body?.action;
    
    // CLEAR/EMPTY DATABASE ACTION - ⚠️ DANGEROUS: Deletes all data
    if (action === 'clear' || action === 'empty') {
      console.log('⚠️ WARNING: Clearing all database collections...');
      
      const toursDeleted = await Tour.deleteMany({});
      const highlightsDeleted = await TourHighlight.deleteMany({});
      const includedDeleted = await TourIncluded.deleteMany({});
      const excludedDeleted = await TourExcluded.deleteMany({});
      const itineraryDeleted = await TourItinerary.deleteMany({});
      
      console.log('✅ Database cleared!');
      
      return res.status(200).json({
        success: true,
        message: 'Database cleared successfully',
        deleted: {
          tours: toursDeleted.deletedCount,
          highlights: highlightsDeleted.deletedCount,
          included: includedDeleted.deletedCount,
          excluded: excludedDeleted.deletedCount,
          itinerary: itineraryDeleted.deletedCount
        },
        warning: 'All data has been permanently deleted. Restore from backup if needed.'
      });
    }
    
    // BACKUP ACTION
    if (action === 'backup') {
      console.log('Starting database backup...');
      
      const tours = await Tour.find({}).lean();
      const highlights = await TourHighlight.find({}).lean();
      const included = await TourIncluded.find({}).lean();
      const excluded = await TourExcluded.find({}).lean();
      const itinerary = await TourItinerary.find({}).lean();
      
      const backup = {
        timestamp: new Date().toISOString(),
        tours,
        highlights,
        included,
        excluded,
        itinerary,
        summary: {
          tours: tours.length,
          highlights: highlights.length,
          included: included.length,
          excluded: excluded.length,
          itinerary: itinerary.length
        }
      };
      
      console.log('✅ Backup completed!');
      
      return res.status(200).json({
        success: true,
        message: 'Backup completed successfully - Copy this entire response and save as JSON file',
        backup
      });
    }
    
    // MIGRATE ACTION - Move data from Tour arrays to separate collections
    if (action === 'migrate') {
      console.log('Starting migration to separate collections...');
      
      const tours = await Tour.find({}).lean();
      console.log(`Found ${tours.length} tours to migrate`);

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
              await TourHighlight.deleteMany({ tourId });
              await TourHighlight.insertMany(
                tour.highlights.map((value, index) => ({
                  tourId,
                  value: typeof value === 'string' ? value.trim() : String(value),
                  order: index
                }))
              );
              tourUpdated = true;
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
              tourUpdated = true;
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
              tourUpdated = true;
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
              tourUpdated = true;
            }
          }

          if (tourUpdated) {
            migratedCount++;
          } else {
            skippedCount++;
          }
        } catch (error) {
          console.error(`Error migrating tour ${tour._id}:`, error.message);
          errorCount++;
        }
      }

      console.log('✅ Migration completed!');
      
      return res.status(200).json({
        success: true,
        message: 'Migration completed',
        summary: {
          total: tours.length,
          migrated: migratedCount,
          skipped: skippedCount,
          errors: errorCount
        }
      });
    }
    
    // DEFAULT ACTION - Original update-tour-data functionality
    // Fetch all tours
    const tours = await Tour.find({});
    
    let updatedCount = 0;
    
    for (const tour of tours) {
      let needsUpdate = false;
      
      // Ensure overview field exists
      if (!tour.overview && tour.metadata?.overview) {
        tour.overview = tour.metadata.overview;
        needsUpdate = true;
      }
      
      // Ensure highlights field exists
      if (!tour.highlights && tour.metadata?.highlights) {
        tour.highlights = tour.metadata.highlights;
        needsUpdate = true;
      }
      
      // Ensure included field exists
      if (!tour.included && tour.metadata?.included) {
        tour.included = tour.metadata.included;
        needsUpdate = true;
      }
      
      // Ensure excluded field exists
      if (!tour.excluded && tour.metadata?.excluded) {
        tour.excluded = tour.metadata.excluded;
        needsUpdate = true;
      }
      
      // Ensure itinerary field exists
      if (!tour.itinerary && tour.metadata?.itinerary) {
        tour.itinerary = tour.metadata.itinerary;
        needsUpdate = true;
      }
      
      // Ensure datePrices field exists
      if (!tour.datePrices && tour.metadata?.datePrices) {
        tour.datePrices = tour.metadata.datePrices;
        needsUpdate = true;
      }
      
      // If any field was missing and we've added it, save the tour
      if (needsUpdate) {
        await tour.save();
        updatedCount++;
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Successfully updated ${updatedCount} tours with new data structure`,
      totalTours: tours.length,
      usage: {
        backup: 'POST /api/update-tour-data?action=backup',
        migrate: 'POST /api/update-tour-data?action=migrate'
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Operation failed',
      message: error.message
    });
  }
};