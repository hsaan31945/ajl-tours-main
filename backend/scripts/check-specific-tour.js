const Tour = require('../models/Tour');
const Division = require('../models/Division');
const mongoose = require('mongoose');
require('dotenv').config();

// Use the correct environment variable name as set in Vercel
if (process.env.AD) {
  process.env.ADMIN_PASSCODE = process.env.AD;
}

async function checkSpecificTour() {
  try {
    console.log('Connecting to database...');
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is required');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Connected. Finding specific tour...');
    
    const specificTourId = '69519390622e48de89623ae0';
    
    // Try to find the specific tour
    const tour = await Tour.findById(specificTourId);
    
    console.log('Tour found:', !!tour);
    
    if(tour) {
      console.log('Tour ID:', tour._id.toString());
      console.log('Tour name:', tour.name);
      console.log('Tour startLocation:', tour.startLocation);
      console.log('Tour endLocation:', tour.endLocation);
      console.log('Tour price:', tour.price);
      console.log('Tour division ID:', tour.division);
      console.log('Tour division type:', typeof tour.division);
      
      // Check if division exists
      const division = await Division.findById(tour.division);
      console.log('Division found:', !!division);
      if(division) {
        console.log('Division name:', division.name);
        console.log('Division ID:', division._id.toString());
      }
      
      // Check if the tour name or location contains error messages
      const hasErrorName = tour.name && tour.name.includes('Failed to save tour: Division not found');
      const hasErrorStartLocation = tour.startLocation && tour.startLocation.includes('Failed to save tour: Division not found');
      const hasErrorEndLocation = tour.endLocation && tour.endLocation.includes('Failed to save tour: Division not found');
      
      console.log('Has error in name:', hasErrorName);
      console.log('Has error in startLocation:', hasErrorStartLocation);
      console.log('Has error in endLocation:', hasErrorEndLocation);
      
      // Update the tour if it has error messages
      if (hasErrorName || hasErrorStartLocation || hasErrorEndLocation) {
        if (!division) {
          throw new Error('Cannot repair tour-like fields without a valid division in MongoDB');
        }
        const updateData = {};
        if (hasErrorName) {
          updateData.name = `${division.name} Tour`;
          console.log('Updating name field');
        }
        if (hasErrorStartLocation) {
          updateData.startLocation = division.name;
          console.log('Updating startLocation field');
        }
        if (hasErrorEndLocation) {
          updateData.endLocation = division.name;
          console.log('Updating endLocation field');
        }
        
        await Tour.findByIdAndUpdate(specificTourId, updateData);
        console.log('Updated tour with corrected fields');
      } else {
        console.log('Tour does not contain error messages, but may need general correction');
        
        // Check if the tour has invalid or placeholder data
        if (!tour.name || tour.name.includes('Failed to save tour') || tour.name === 'Enter tour name here...') {
          if (!division) {
            throw new Error('Cannot repair tour name without a valid division in MongoDB');
          }
          const correctedName = `${division.name} Tour`;
          await Tour.findByIdAndUpdate(specificTourId, { name: correctedName });
          console.log('Updated tour name to:', correctedName);
        }
        
        if (!tour.startLocation || tour.startLocation.includes('Failed to save tour') || tour.startLocation === 'Enter start location here...') {
          if (!division) {
            throw new Error('Cannot repair start location without a valid division in MongoDB');
          }
          const correctedStartLocation = division.name;
          await Tour.findByIdAndUpdate(specificTourId, { startLocation: correctedStartLocation });
          console.log('Updated start location to:', correctedStartLocation);
        }
        
        if (!tour.endLocation || tour.endLocation.includes('Failed to save tour') || tour.endLocation === 'Enter end location here...') {
          if (!division) {
            throw new Error('Cannot repair end location without a valid division in MongoDB');
          }
          const correctedEndLocation = division.name;
          await Tour.findByIdAndUpdate(specificTourId, { endLocation: correctedEndLocation });
          console.log('Updated end location to:', correctedEndLocation);
        }
      }
    } else {
      console.log('Tour not found with that ID');
      console.log('Attempting to find any tours with error messages...');
      
      // Try searching for tours with error messages
      const errorTours = await Tour.find({
        $or: [
          { name: { $regex: /Failed to save tour: Division not found/ } },
          { startLocation: { $regex: /Failed to save tour: Division not found/ } },
          { endLocation: { $regex: /Failed to save tour: Division not found/ } }
        ]
      });
      console.log('Error tours found:', errorTours.length);
      errorTours.forEach(t => {
        console.log('Error tour ID:', t._id.toString(), 'Name:', t.name);
      });
    }
    
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSpecificTour();
