const config = require('../../../lib/config');
const { connectDB } = require('../../../lib/db');
const TourHighlight = require('../../../models/TourHighlight');
const TourIncluded = require('../../../models/TourIncluded');
const TourExcluded = require('../../../models/TourExcluded');
const TourItinerary = require('../../../models/TourItinerary');

// Consolidated endpoint for all array field operations
// Supports: highlights, included, excluded, itinerary
// Usage: /api/tours/:id/arrays?field=highlights
module.exports = async (req, res) => {
  // #region agent log
  fetch('',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'arrays.js:11',message:'Arrays API entry',data:{method:req.method,url:req.url,query:req.query,hasBody:!!req.body,bodyType:typeof req.body},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  res.setHeader('Access-Control-Allow-Origin', config.cors.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Passcode');
  res.setHeader('Access-Control-Allow-Credentials', config.cors.credentials);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
    const { id, field } = req.query;

    // #region agent log
    fetch('',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'arrays.js:23',message:'After DB connect and query extract',data:{id,field,queryKeys:Object.keys(req.query)},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    console.log('Arrays API - Request:', { method: req.method, id, field, url: req.url });

    // Parse request body for POST/PUT/DELETE
    // Vercel serverless functions: try req.body first (may be auto-parsed), then stream
    let bodyData = {};
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
      console.log('Arrays API - Before body parsing:', { method: req.method, reqBodyExists: !!req.body, reqBodyType: typeof req.body });
      
      // Check if body is already parsed as object (Vercel auto-parsing)
      if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body) && !Array.isArray(req.body)) {
        bodyData = req.body;
        console.log('Arrays API - Using pre-parsed req.body:', bodyData);
      } else {
        // Manually parse from stream
        try {
          const chunks = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const bodyStr = chunks.length > 0 ? Buffer.concat(chunks).toString() : (typeof req.body === 'string' ? req.body : '{}');
          bodyData = JSON.parse(bodyStr || '{}');
          console.log('Arrays API - Parsed body from stream:', bodyData);
        } catch (e) {
          console.error('Arrays API - Body parse error:', e.message);
          return res.status(400).json({ error: 'Invalid request body', details: e.message });
        }
      }
    }

    // Validate field name
    const validFields = ['highlights', 'included', 'excluded', 'itinerary'];
    if (!field || !validFields.includes(field)) {
      console.error('Arrays API - Invalid field:', field);
      return res.status(400).json({ 
        error: `Invalid field. Must provide ?field= parameter with one of: ${validFields.join(', ')}` 
      });
    }

    if (!id) {
      console.error('Arrays API - Missing tour ID');
      return res.status(400).json({ error: 'Tour ID is required' });
    }

    // Select the appropriate model
    let Model, valueKey;
    if (field === 'highlights') {
      Model = TourHighlight;
      valueKey = 'value';
    } else if (field === 'included') {
      Model = TourIncluded;
      valueKey = 'value';
    } else if (field === 'excluded') {
      Model = TourExcluded;
      valueKey = 'value';
    } else if (field === 'itinerary') {
      Model = TourItinerary;
      valueKey = null; // itinerary has multiple fields
    }

    // Validate tour exists
    const Tour = require('../../../models/Tour');
    const tour = await Tour.findById(id);
    if (!tour) {
      return res.status(404).json({ error: 'Tour not found' });
    }

    if (req.method === 'GET') {
      // Get all items for the field, ordered by order field
      const items = await Model.find({ tourId: id })
        .sort({ order: 1 })
        .lean();
      
      if (field === 'itinerary') {
        return res.status(200).json({
          success: true,
          itinerary: items.map(item => ({
            title: item.title,
            description: item.description,
            duration: item.duration,
            location: item.location,
            activities: item.activities || []
          }))
        });
      } else {
        return res.status(200).json({
          success: true,
          [field]: items.map(item => item[valueKey])
        });
      }
    } else if (req.method === 'POST') {
      // Add new item
      if (field === 'itinerary') {
        const { item } = bodyData;
        
        if (!item || typeof item !== 'object') {
          return res.status(400).json({ error: 'Invalid itinerary item' });
        }

        const lastItem = await Model.findOne({ tourId: id })
          .sort({ order: -1 })
          .lean();
        
        const newOrder = lastItem ? lastItem.order + 1 : 0;

        const newItineraryItem = new Model({
          tourId: id,
          title: item.title || 'New Location',
          description: item.description || '',
          duration: item.duration || '',
          location: item.location || '',
          activities: Array.isArray(item.activities) ? item.activities : [],
          order: newOrder
        });

        await newItineraryItem.save();

        return res.status(200).json({
          success: true,
          item: newItineraryItem.toObject()
        });
      } else {
        const { value } = bodyData;
        
        console.log('Arrays API - POST handler for non-itinerary field:', { field, bodyData, value, valueType: typeof value, hasValue: !!value });
        
        if (!value || typeof value !== 'string') {
          console.error('Arrays API - Value validation failed:', { value, valueType: typeof value, bodyData });
          return res.status(400).json({ error: `Invalid ${field} value. Expected a string, got: ${typeof value}` });
        }

        // #region agent log
        fetch('',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'arrays.js:151',message:'Before finding last item',data:{tourId:id,Model:Model.modelName},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
        // #endregion

        const lastItem = await Model.findOne({ tourId: id })
          .sort({ order: -1 })
          .lean();
        
        const newOrder = lastItem ? lastItem.order + 1 : 0;

        // #region agent log
        fetch('',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'arrays.js:158',message:'Creating new item',data:{tourId:id,valueKey,value,newOrder},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
        // #endregion

        const newItem = new Model({
          tourId: id,
          [valueKey]: value.trim(),
          order: newOrder
        });

        console.log('Arrays API - Before saving new item:', { field, tourId: id, value: value.trim(), newOrder });

        try {
          await newItem.save();
          console.log('Arrays API - Successfully saved new item:', { itemId: newItem._id, field });
        } catch (saveError) {
          console.error('Arrays API - Save error:', saveError.message, saveError);
          return res.status(500).json({ 
            error: 'Failed to save item',
            message: saveError.message 
          });
        }

        return res.status(200).json({
          success: true,
          item: {
            id: newItem._id,
            [valueKey]: newItem[valueKey],
            order: newItem.order
          }
        });
      }
    } else if (req.method === 'PUT') {
      // Update entire array (reorder/replace all)
      const arrayData = bodyData[field];
      
      if (!Array.isArray(arrayData)) {
        return res.status(400).json({ error: `${field} must be an array` });
      }

      // Delete all existing items for this tour
      await Model.deleteMany({ tourId: id });

      // Insert new items with proper order
      if (arrayData.length > 0) {
        if (field === 'itinerary') {
          const newItems = arrayData.map((item, index) => ({
            tourId: id,
            title: item.title || 'New Location',
            description: item.description || '',
            duration: item.duration || '',
            location: item.location || '',
            activities: Array.isArray(item.activities) ? item.activities : [],
            order: index
          }));
          await Model.insertMany(newItems);
        } else {
          const newItems = arrayData.map((value, index) => ({
            tourId: id,
            [valueKey]: typeof value === 'string' ? value.trim() : String(value),
            order: index
          }));
          await Model.insertMany(newItems);
        }
      }

      // Return updated list
      const updated = await Model.find({ tourId: id })
        .sort({ order: 1 })
        .lean();

      if (field === 'itinerary') {
        return res.status(200).json({
          success: true,
          itinerary: updated.map(item => ({
            title: item.title,
            description: item.description,
            duration: item.duration,
            location: item.location,
            activities: item.activities || []
          }))
        });
      } else {
        return res.status(200).json({
          success: true,
          [field]: updated.map(item => item[valueKey])
        });
      }
    } else if (req.method === 'DELETE') {
      // Delete specific item by ID or index
      const { itemId, index } = bodyData;

      if (itemId) {
        // Delete by ID
        await Model.findOneAndDelete({ _id: itemId, tourId: id });
      } else if (typeof index === 'number') {
        // Delete by index (order)
        const item = await Model.findOne({ tourId: id })
          .sort({ order: 1 })
          .skip(index)
          .lean();
        
        if (item) {
          await Model.findByIdAndDelete(item._id);
        }
      } else {
        return res.status(400).json({ error: 'Must provide itemId or index' });
      }

      // Reorder remaining items
      const remaining = await Model.find({ tourId: id })
        .sort({ order: 1 })
        .lean();
      
      for (let i = 0; i < remaining.length; i++) {
        await Model.findByIdAndUpdate(remaining[i]._id, { order: i });
      }

      const updated = await Model.find({ tourId: id })
        .sort({ order: 1 })
        .lean();

      if (field === 'itinerary') {
        return res.status(200).json({
          success: true,
          itinerary: updated.map(item => ({
            title: item.title,
            description: item.description,
            duration: item.duration,
            location: item.location,
            activities: item.activities || []
          }))
        });
      } else {
        return res.status(200).json({
          success: true,
          [field]: updated.map(item => item[valueKey])
        });
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    // #region agent log
    fetch('',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'arrays.js:282',message:'Catch block - error occurred',data:{errorMessage:error.message,errorStack:error.stack,errorName:error.name,field:req.query.field,method:req.method},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    console.error(`Array field API error (${req.query.field}):`, error);
    return res.status(500).json({
      error: 'Internal server error',
      message: config.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      details: config.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

