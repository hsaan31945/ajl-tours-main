const Tour = require('../models/Tour');
const Division = require('../models/Division');
const mongoose = require('mongoose');
require('dotenv').config();

async function fixTourData() {
  try {
    console.log('Connecting to database...');
    // Use the correct environment variable name as set in Vercel
    if (process.env.AD) {
      process.env.ADMIN_PASSCODE = process.env.AD;
    }
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:salman1122@ajltours.ozyldk7.mongodb.net/AJLTours?appName=AJLTours');
    
    console.log('Finding tours with error messages in name or location fields...');
    
    // Find tours that have the error message in their name or location fields
    const errorPattern = /Failed to save tour: Division not found/;
    
    // Also specifically target the tour mentioned in the issue
    const specificTourId = '69519390622e48de89623ae0';
    
    const toursToUpdate = await Tour.find({
      $or: [
        { name: { $regex: errorPattern } },
        { startLocation: { $regex: errorPattern } },
        { endLocation: { $regex: errorPattern } },
        { _id: new mongoose.Types.ObjectId(specificTourId) }
      ]
    });
    
    console.log(`Found ${toursToUpdate.length} tours with error messages in their data`);
    
    for (const tour of toursToUpdate) {
      console.log(`Processing tour ID: ${tour._id}`);
      
      // Check if the division reference is valid
      const division = await Division.findById(tour.division);
      
      if (division) {
        console.log(`  Division found: ${division.name}`);
        
        // Update the tour with proper default values if they contain error messages
        let updated = false;
        const updateData = {};
        
        if (tour.name && tour.name.includes('Failed to save tour: Division not found')) {
          updateData.name = division.name + ' Tour';
          updated = true;
          console.log('  Fixed name field');
        }
        
        if (tour.startLocation && tour.startLocation.includes('Failed to save tour: Division not found')) {
          updateData.startLocation = division.name;
          updated = true;
          console.log('  Fixed startLocation field');
        }
        
        if (tour.endLocation && tour.endLocation.includes('Failed to save tour: Division not found')) {
          updateData.endLocation = division.name;
          updated = true;
          console.log('  Fixed endLocation field');
        }
        
        if (updated) {
          await Tour.findByIdAndUpdate(tour._id, updateData);
          console.log(`  Updated tour ${tour._id}`);
        } else {
          console.log(`  No updates needed for tour ${tour._id}`);
        }
      } else {
        console.log(`  Warning: Division ${tour.division} not found for tour ${tour._id}`);
      }
    }
    
    console.log('Tour data fix script completed');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error fixing tour data:', error);
    process.exit(1);
  }
}

// Run the script
fixTourData();