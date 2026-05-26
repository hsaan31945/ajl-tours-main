const Tour = require('../models/Tour');
const Division = require('../models/Division');
const mongoose = require('mongoose');
require('dotenv').config();

// Use the correct environment variable name as set in Vercel
if (process.env.AD) {
  process.env.ADMIN_PASSCODE = process.env.AD;
}

async function fixSpecificTour() {
  try {
    console.log('Connecting to database...');
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is required');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Connected. Finding and fixing specific tour...');
    
    const specificTourId = '69519390622e48de89623ae0';
    
    // Try to find the specific tour
    const tour = await Tour.findById(specificTourId);
    
    console.log('Tour found:', !!tour);
    
    if(tour) {
      console.log('Current tour data:');
      console.log('  ID:', tour._id.toString());
      console.log('  Name:', tour.name);
      console.log('  Start Location:', tour.startLocation);
      console.log('  End Location:', tour.endLocation);
      console.log('  Division ID:', tour.division);
      
      // Check if division exists
      const division = await Division.findById(tour.division);
      console.log('Division found:', !!division);
      if(division) {
        console.log('Division name:', division.name);
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
          console.log('Setting name to:', updateData.name);
        }
        if (hasErrorStartLocation) {
          updateData.startLocation = division.name;
          console.log('Setting startLocation to:', updateData.startLocation);
        }
        if (hasErrorEndLocation) {
          updateData.endLocation = division.name;
          console.log('Setting endLocation to:', updateData.endLocation);
        }
        
        await Tour.findByIdAndUpdate(specificTourId, updateData);
        console.log('Updated tour with corrected fields');
        
        // Verify the update
        const updatedTour = await Tour.findById(specificTourId);
        console.log('Updated tour data:');
        console.log('  Name:', updatedTour.name);
        console.log('  Start Location:', updatedTour.startLocation);
        console.log('  End Location:', updatedTour.endLocation);
      } else {
        console.log('Tour does not contain the specific error messages');
      }
    } else {
      console.log('Tour not found with that ID');
    }
    
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixSpecificTour();
