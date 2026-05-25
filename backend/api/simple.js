const { connectDB, models } = require('../lib/db');
const Tour = require('../models/Tour');
const Division = require('../models/Division');
const config = require('../lib/config');

// Simple in-memory cache to avoid repeatedly hitting Mongo for reads
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes for list responses
const SINGLE_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes for individual tour responses
let toursCache = { data: null, expiresAt: 0 };
const tourByIdCache = new Map();

const cacheValid = (entry) => entry && entry.expiresAt > Date.now();

const normalizeDatePrices = (datePrices) => {
  if (!datePrices) return {};
  if (datePrices instanceof Map) return Object.fromEntries(datePrices);
  if (typeof datePrices === 'object') return datePrices;
  return {};
};

const normalizeTour = (tour) => {
  const division = tour.division;
  const divisionId = division?._id?.toString?.() || (typeof division === 'string' ? division : null);
  const divisionName = typeof division === 'object' ? division?.name : null;
  const datePrices = normalizeDatePrices(tour.datePrices);
  const id = tour._id?.toString?.() || tour._id;

  return {
    id,
    _id: id,
    name: tour.name,
    description: tour.description,
    overview: tour.overview || '',
    price: tour.price,
    images: tour.images || [],
    startLocation: tour.startLocation,
    endLocation: tour.endLocation,
    routeDetails: tour.routeDetails,
    division: divisionId,
    divisionName,
    metadata: tour.metadata || {},
    itinerary: tour.itinerary || [],
    highlights: tour.highlights || [],
    included: tour.included || [],
    excluded: tour.excluded || [],
    duration: tour.duration || '',
    tourType: tour.tourType || '',
    reviewText: tour.reviewText || '',
    datePrices,
    startDate: tour.startDate,
    endDate: tour.endDate,
    minTicketsPerBooking: tour.minTicketsPerBooking,
    maxTotalTickets: tour.maxTotalTickets,
    // Frontend-friendly aliases for existing UI code
    start_date: tour.startDate,
    end_date: tour.endDate,
    start_location: tour.startLocation,
    end_location: tour.endLocation,
    min_tickets_per_booking: tour.minTicketsPerBooking,
    max_total_tickets: tour.maxTotalTickets,
    available_tickets: tour.maxTotalTickets,
    division_id: divisionId,
    destination: divisionName || tour.metadata?.destination || 'switzerland',
    route_details: tour.routeDetails
  };
};

const setCacheHeaders = (res) => {
  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=120');
};

const invalidateTourCache = (id) => {
  toursCache = { data: null, expiresAt: 0 };
  if (id) {
    tourByIdCache.delete(id.toString());
  } else {
    tourByIdCache.clear();
  }
};

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', config.cors?.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Passcode');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Connect to database
    await connectDB();
    
    // Parse request body for POST/PUT requests
    let body = {};
    if (req.method === 'POST' || req.method === 'PUT') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const bodyStr = Buffer.concat(chunks).toString() || '{}';
      try {
        body = JSON.parse(bodyStr);
      } catch (e) {
        body = {};
      }
    }

    // Parse URL - handle Vercel serverless function URLs
    let url = req.url || '';
    // Remove query string if present
    url = url.split('?')[0];
    // Ensure URL starts with /api for consistency
    if (!url.startsWith('/api') && url.startsWith('/')) {
      url = '/api' + url;
    } else if (!url.startsWith('/')) {
      url = '/api/' + url;
    }
    // Normalize trailing slashes for matching
    const urlNormalized = url.endsWith('/') && url.length > 1 ? url.slice(0, -1) : url;
    
    console.log('API Request:', { method: req.method, originalUrl: req.url, parsedUrl: url, normalized: urlNormalized });
    
    // Health check
    if (urlNormalized === '/api/health') {
      return res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: 'serverless',
        database: 'MongoDB Connected'
      });
    }
    
    // Test endpoint
    if (urlNormalized === '/api/test') {
      return res.status(200).json({
        message: 'Serverless API is working!',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        environment: 'serverless'
      });
    }

    // Divisions API
    if (url.startsWith('/api/divisions')) {
      if (req.method === 'GET') {
        const divisions = await Division.find({ isActive: true }).sort({ name: 1 });
        return res.json(divisions.map(div => ({
          id: div._id.toString(),
          _id: div._id.toString(),
          name: div.name,
          description: div.description,
          isActive: div.isActive
        })));
      }
      if (req.method === 'POST') {
        const header = req.headers['x-admin-passcode'] || req.headers['X-Admin-Passcode'];
        const expected = process.env.ADMIN_PASSCODE || 'admin123';
        const headerTrimmed = header ? header.trim() : null;
        const expectedTrimmed = expected ? expected.trim() : null;
        if (!headerTrimmed || headerTrimmed !== expectedTrimmed) {
          return res.status(401).json({ message: 'Invalid or missing admin passcode' });
        }
        const { name, description } = body;
        if (!name) {
          return res.status(400).json({ message: 'Name is required' });
        }
        const division = new Division({ name, description: description || '' });
        await division.save();
        return res.status(201).json({
          id: division._id.toString(),
          _id: division._id.toString(),
          name: division.name,
          description: division.description,
          isActive: division.isActive
        });
      }
    }

    // Tours API
    if (urlNormalized.startsWith('/api/tours')) {
      console.log('Tours API matched, method:', req.method, 'url:', url, 'normalized:', urlNormalized);
      
      // Extract tour ID if present
      let tourId = null;
      const tourIdMatch = urlNormalized.match(/^\/api\/tours\/([^\/]+)$/);
      if (tourIdMatch) {
        tourId = tourIdMatch[1];
      }
      
      // Handle different HTTP methods
      switch (req.method) {
        case 'GET':
          if (tourId) {
            // GET single tour
            const cachedTour = tourByIdCache.get(tourId);
            if (cacheValid(cachedTour)) {
              setCacheHeaders(res);
              return res.json(cachedTour.data);
            }

            const tour = await Tour.findById(tourId)
              .select('name description price images startLocation endLocation routeDetails division itinerary datePrices metadata startDate endDate minTicketsPerBooking maxTotalTickets isActive createdAt updatedAt')
              .populate({ path: 'division', select: 'name', options: { lean: true } })
              .lean({ virtuals: true });
            if (!tour) {
              return res.status(404).json({ message: 'Tour not found' });
            }

            const normalizedTour = normalizeTour(tour);
            tourByIdCache.set(tourId, { data: normalizedTour, expiresAt: Date.now() + SINGLE_CACHE_TTL_MS });
            setCacheHeaders(res);
            return res.json(normalizedTour);
          } else {
            // Check if this is a request for Switzerland tours only
            if (urlNormalized === '/api/tours/switzerland') {
              // GET Switzerland tours only - optimized query
              const cachedList = cacheValid(toursCache) ? toursCache.data : null;
              if (cachedList && cachedList.some(tour => tour.destination === 'switzerland' || tour.divisionName?.toLowerCase().includes('switzerland'))) {
                // Filter cached tours for Switzerland only
                const swissTours = cachedList.filter(tour => 
                  tour.destination === 'switzerland' || 
                  tour.divisionName?.toLowerCase().includes('switzerland') ||
                  !tour.destination
                ).slice(0, 6);
                
                if (swissTours.length > 0) {
                  setCacheHeaders(res);
                  return res.json(swissTours);
                }
              }

              console.log('Fetching Switzerland tours from database...');
              const nowTs = Date.now();
              
              // First, find the Switzerland division
              const swissDivision = await Division.findOne({ 
                name: { $regex: /switzerland/i },
                isActive: true 
              }).select('_id').lean();
              
              // Query tours with Switzerland division or fallback
              const query = swissDivision 
                ? { 
                    $and: [
                      { isActive: true },
                      { 
                        $or: [
                          { division: swissDivision._id },
                          { destination: { $regex: /switzerland/i } }
                        ]
                      }
                    ]
                  }
                : { 
                    $and: [
                      { isActive: true },
                      { destination: { $regex: /switzerland/i } }
                    ]
                  };
              
              const tours = await Tour.find(query)
                .select('name description price images startLocation endLocation routeDetails division itinerary datePrices metadata startDate endDate minTicketsPerBooking maxTotalTickets isActive createdAt updatedAt destination')
                .populate({ path: 'division', select: 'name', options: { lean: true } })
                .sort({ createdAt: -1 })
                .limit(6) // Only fetch what we need
                .lean({ virtuals: true });
              
              console.log('Found Switzerland tours:', tours.length);

              const transformedTours = tours.map(normalizeTour);
              
              // Update cache with these tours
              toursCache = { data: transformedTours, expiresAt: nowTs + CACHE_TTL_MS };
              transformedTours.forEach((tour) => {
                tourByIdCache.set(tour.id, { data: tour, expiresAt: nowTs + SINGLE_CACHE_TTL_MS });
              });

              setCacheHeaders(res);
              return res.json(transformedTours);
            } else {
              // GET all tours
              const cachedList = cacheValid(toursCache) ? toursCache.data : null;
              if (cachedList) {
                setCacheHeaders(res);
                return res.json(cachedList);
              }

              console.log('Fetching all tours from database...');
              const nowTs = Date.now();
              const tours = await Tour.find({ isActive: true })
                .select('name description price images startLocation endLocation routeDetails division itinerary datePrices metadata startDate endDate minTicketsPerBooking maxTotalTickets isActive createdAt updatedAt')
                .populate({ path: 'division', select: 'name', options: { lean: true } })
                .sort({ createdAt: -1 })
                .lean({ virtuals: true });
              console.log('Found tours:', tours.length);

              const transformedTours = tours.map(normalizeTour);
              toursCache = { data: transformedTours, expiresAt: nowTs + CACHE_TTL_MS };
              transformedTours.forEach((tour) => {
                tourByIdCache.set(tour.id, { data: tour, expiresAt: nowTs + SINGLE_CACHE_TTL_MS });
              });

              setCacheHeaders(res);
              return res.json(transformedTours);
            }
          }
          break;
          
        case 'POST':
          // POST create tour
          if (!tourId) { // Only for /api/tours (not /api/tours/:id)
            try {
              const header = req.headers['x-admin-passcode'] || req.headers['X-Admin-Passcode'];
              const expected = process.env.ADMIN_PASSCODE || 'admin123';
              const headerTrimmed = header ? header.trim() : null;
              const expectedTrimmed = expected ? expected.trim() : null;
              if (!headerTrimmed || headerTrimmed !== expectedTrimmed) {
                return res.status(401).json({ message: 'Invalid or missing admin passcode' });
              }

              const { division, name, description, overview, price, startLocation, endLocation, routeDetails, startDate, endDate, images, itinerary, highlights, included, excluded, duration, tourType, reviewText, minTicketsPerBooking, maxTotalTickets, metadata } = body;

              if (!name || price === undefined || price === null) {
                return res.status(400).json({ message: 'Name and price are required' });
              }

              // Handle division - create if doesn't exist or use provided
              let divisionId = division;
              try {
                if (!division) {
                  // Try to find or create a default division
                  let defaultDivision = await Division.findOne({ name: 'Switzerland' });
                  if (!defaultDivision) {
                    defaultDivision = new Division({
                      name: 'Switzerland',
                      description: 'Tours in Switzerland',
                      isActive: true
                    });
                    await defaultDivision.save();
                    console.log('Created default Switzerland division:', defaultDivision._id);
                  }
                  divisionId = defaultDivision._id;
                } else {
                  // Verify division exists
                  const divisionExists = await Division.findById(division);
                  if (!divisionExists) {
                    return res.status(400).json({ message: 'Division not found. Please create a division first.' });
                  }
                  divisionId = division;
                }
              } catch (divError) {
                console.error('Error handling division:', divError);
                return res.status(500).json({ 
                  message: 'Failed to process division', 
                  error: config.NODE_ENV === 'development' ? divError.message : 'Internal server error'
                });
              }

              const tour = new Tour({
                division: divisionId,
                name: String(name).trim(),
                description: description ? String(description).trim() : '',
                overview: overview ? String(overview).trim() : '',
                price: Number(price),
                startDate: startDate ? new Date(startDate) : new Date(),
                endDate: endDate ? new Date(endDate) : new Date(Date.now() + 24 * 60 * 60 * 1000),
                startLocation: startLocation ? String(startLocation).trim() : '',
                endLocation: endLocation ? String(endLocation).trim() : '',
                routeDetails: routeDetails ? String(routeDetails).trim() : '',
                images: Array.isArray(images) ? images : [],
                itinerary: Array.isArray(itinerary) ? itinerary : [],
                highlights: Array.isArray(highlights) ? highlights : [],
                included: Array.isArray(included) ? included : [],
                excluded: Array.isArray(excluded) ? excluded : [],
                duration: duration ? String(duration).trim() : '',
                tourType: tourType ? String(tourType).trim() : '',
                reviewText: reviewText ? String(reviewText).trim() : '',
                minTicketsPerBooking: minTicketsPerBooking ? Number(minTicketsPerBooking) : 1,
                maxTotalTickets: maxTotalTickets ? Number(maxTotalTickets) : null,
                metadata: metadata && typeof metadata === 'object' ? metadata : {},
                isActive: true
              });

              await tour.save();
              await tour.populate('division', 'name');

              const normalizedTour = normalizeTour(tour.toObject({ virtuals: true }));
              invalidateTourCache(normalizedTour.id);

              return res.status(201).json({
                success: true,
                message: 'Tour created successfully',
                tour: normalizedTour
              });
            } catch (tourError) {
              console.error('Error creating tour:', tourError);
              return res.status(500).json({
                success: false,
                message: 'Failed to create tour',
                error: config.NODE_ENV === 'development' ? tourError.message : 'Internal server error',
                details: config.NODE_ENV === 'development' ? tourError.stack : undefined
              });
            }
          }
          break;
          
        case 'PUT':
          // PUT update tour
          if (tourId) {
            const header = req.headers['x-admin-passcode'] || req.headers['X-Admin-Passcode'];
            const expected = process.env.ADMIN_PASSCODE || 'admin123';
            const headerTrimmed = header ? header.trim() : null;
            const expectedTrimmed = expected ? expected.trim() : null;
            if (!headerTrimmed || headerTrimmed !== expectedTrimmed) {
              return res.status(401).json({ message: 'Invalid or missing admin passcode' });
            }

            const tour = await Tour.findById(tourId);
            if (!tour) {
              return res.status(404).json({ message: 'Tour not found' });
            }

            // Update fields
            if (body.name !== undefined) tour.name = body.name;
            if (body.description !== undefined) tour.description = body.description;
            if (body.price !== undefined) tour.price = Number(body.price);
            if (body.startLocation !== undefined) tour.startLocation = body.startLocation;
            if (body.endLocation !== undefined) tour.endLocation = body.endLocation;
            if (body.routeDetails !== undefined) tour.routeDetails = body.routeDetails;
            if (body.images !== undefined) tour.images = Array.isArray(body.images) ? body.images : [];
            if (body.metadata !== undefined) tour.metadata = body.metadata;
            if (body.itinerary !== undefined) tour.itinerary = Array.isArray(body.itinerary) ? body.itinerary : [];
            if (body.datePrices !== undefined) {
              // Convert object to Map
              tour.datePrices = new Map(Object.entries(body.datePrices));
            }

            await tour.save();
            await tour.populate('division', 'name');

            const normalizedTour = normalizeTour(tour.toObject({ virtuals: true }));
            invalidateTourCache(normalizedTour.id);

            return res.json(normalizedTour);
          }
          break;
          
        case 'DELETE':
          // DELETE tour
          if (tourId) {
            const tour = await Tour.findById(tourId);
            if (!tour) {
              return res.status(404).json({ message: 'Tour not found' });
            }

            // Delete the tour
            await Tour.deleteOne({ _id: tourId });
            invalidateTourCache(tourId);

            return res.json({ 
              success: true, 
              message: 'Tour deleted successfully',
              deletedTourId: tourId
            });
          }
          break;
          
        case 'PATCH':
          // PATCH update itinerary
          const itineraryMatch = urlNormalized.match(/^\/api\/tours\/([^\/]+)\/itinerary$/);
          if (itineraryMatch) {
            const header = req.headers['x-admin-passcode'] || req.headers['X-Admin-Passcode'];
            const expected = process.env.ADMIN_PASSCODE || 'admin123';
            const headerTrimmed = header ? header.trim() : null;
            const expectedTrimmed = expected ? expected.trim() : null;
            if (!headerTrimmed || headerTrimmed !== expectedTrimmed) {
              return res.status(401).json({ message: 'Invalid or missing admin passcode' });
            }

            const tour = await Tour.findById(itineraryMatch[1]);
            if (!tour) {
              return res.status(404).json({ message: 'Tour not found' });
            }

            if (body.itinerary !== undefined) {
              tour.itinerary = Array.isArray(body.itinerary) ? body.itinerary : [];
              await tour.save();
            }

            invalidateTourCache(tour._id);

            return res.json({ success: true, itinerary: tour.itinerary });
          }
          
          // PATCH update date price
          const datePriceMatch = urlNormalized.match(/^\/api\/tours\/([^\/]+)\/date-price$/);
          if (datePriceMatch) {
            const header = req.headers['x-admin-passcode'] || req.headers['X-Admin-Passcode'];
            const expected = process.env.ADMIN_PASSCODE || 'admin123';
            const headerTrimmed = header ? header.trim() : null;
            const expectedTrimmed = expected ? expected.trim() : null;
            if (!headerTrimmed || headerTrimmed !== expectedTrimmed) {
              return res.status(401).json({ message: 'Invalid or missing admin passcode' });
            }

            const tour = await Tour.findById(datePriceMatch[1]);
            if (!tour) {
              return res.status(404).json({ message: 'Tour not found' });
            }

            const { date, price } = body;
            if (!date || price === undefined) {
              return res.status(400).json({ message: 'Date and price are required' });
            }

            if (!tour.datePrices) {
              tour.datePrices = new Map();
            }
            tour.datePrices.set(date, Number(price));
            await tour.save();

            invalidateTourCache(tour._id);

            return res.json({ 
              success: true, 
              datePrices: Object.fromEntries(tour.datePrices) 
            });
          }
          break;
      }
    }
    
    // Default response
    res.status(200).json({
      message: 'Serverless API is running',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
