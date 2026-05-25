const config = require('../../../../lib/config');
const { connectDB } = require('../../../../lib/db');
const Tour = require('../../../../models/Tour');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', config.cors.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Passcode');
  res.setHeader('Access-Control-Allow-Credentials', config.cors.credentials);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
    
    const { id } = req.query;
    
    if (req.method === 'GET') {
      // Get specific tour date and price by ID
      const tour = await Tour.findById(id);
      
      if (!tour) {
        return res.status(404).json({ error: 'Tour not found' });
      }
      
      return res.status(200).json({ 
        date: tour.date || null,
        price: tour.price || null 
      });
    } else if (req.method === 'PATCH') {
      // Update tour date prices by ID
      const { date, price, datePrices: fullDatePrices } = req.body;
      
      // Get the existing tour to access current datePrices
      const existingTour = await Tour.findById(id);
      if (!existingTour) {
        return res.status(404).json({ error: 'Tour not found' });
      }
      
      let updatedDatePrices = existingTour.datePrices || {};
      
      // If updating individual date/price, merge with existing
      if (date && price !== undefined) {
        updatedDatePrices = { ...updatedDatePrices, [date]: price };
      } else if (fullDatePrices) {
        // If sending full datePrices object, replace entirely
        updatedDatePrices = fullDatePrices;
      }
      
      const updatedTour = await Tour.findByIdAndUpdate(
        id,
        { datePrices: updatedDatePrices },
        { new: true, runValidators: true }
      );
      
      if (!updatedTour) {
        return res.status(404).json({ error: 'Tour not found' });
      }
      
      return res.status(200).json({ datePrices: updatedTour.datePrices });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Serverless API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: config.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};