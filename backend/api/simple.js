const { connectDB, models } = require('../lib/db');
const Tour = require('../models/Tour');
const User = require('../models/User');
const Division = require('../models/Division');
const config = require('../lib/config');
const tourService = require('../src/services/tourService');

// Do not keep tour data in serverless memory; MongoDB is the source of truth.
const CACHE_TTL_MS = 2 * 60 * 1000;
const SINGLE_CACHE_TTL_MS = 2 * 60 * 1000;
let toursCache = { data: null, expiresAt: 0 };
const tourByIdCache = new Map();

const cacheValid = (entry) => entry && entry.expiresAt > Date.now();

const isValidAdminPasscode = (headerValue) => {
  const expected = process.env.ADMIN_PASSCODE || '';
  const headerTrimmed = headerValue ? String(headerValue).trim() : '';
  const expectedTrimmed = expected ? String(expected).trim() : '';
  return Boolean(expectedTrimmed && headerTrimmed && headerTrimmed === expectedTrimmed);
};

const normalizeDatePrices = (datePrices) => {
  if (!datePrices) return {};
  if (datePrices instanceof Map) return Object.fromEntries(datePrices);
  if (Array.isArray(datePrices)) {
    return datePrices.reduce((acc, entry) => {
      if (!entry?.date) return acc;
      const price = Number(entry.price);
      if (Number.isFinite(price)) acc[entry.date] = price;
      return acc;
    }, {});
  }
  if (typeof datePrices === 'object') {
    return Object.entries(datePrices).reduce((acc, [date, price]) => {
      const numericPrice = Number(price);
      if (date && Number.isFinite(numericPrice)) acc[date] = numericPrice;
      return acc;
    }, {});
  }
  return {};
};

const normalizeTour = (tour) => {
  const division = tour.division;
  const divisionId = division?._id?.toString?.() || (typeof division === 'string' ? division : null);
  const divisionName = typeof division === 'object' ? division?.name : null;
  const datePrices = normalizeDatePrices(tour.datePrices);
  const rawDiscountPrice =
    tour.discountPrice ??
    tour.discountedPrice ??
    tour.salePrice ??
    tour.metadata?.discountPrice ??
    tour.metadata?.discountedPrice ??
    tour.metadata?.salePrice ??
    tour.metadata?.discount?.price ??
    null;
  const normalizedDiscountPrice =
    rawDiscountPrice !== null && rawDiscountPrice !== undefined && rawDiscountPrice !== '' &&
    Number.isFinite(Number(rawDiscountPrice)) && Number(rawDiscountPrice) >= 0
      ? Number(rawDiscountPrice)
      : null;
  const normalizeGroupDiscountValue = (value) => (
    value !== null && value !== undefined && value !== '' &&
    Number.isFinite(Number(value)) && Number(value) >= 0
      ? Math.min(100, Number(value))
      : null
  );
  const id = tour._id?.toString?.() || tour._id;
  const normalizedReviews = Array.isArray(tour.reviews)
    ? tour.reviews
        .map((review) => {
          const rating = Number(review.rating);
          if (!Number.isFinite(rating)) return null;
          const userId = review.user?._id?.toString?.() || review.user?.toString?.() || String(review.user || '');
          return {
            id: review._id?.toString?.() || userId,
            userId,
            userName: review.userName || 'AJL Tour guest',
            rating,
            description: review.description || '',
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
          };
        })
        .filter(Boolean)
    : [];
  const reviewAverage = normalizedReviews.length
    ? Math.round((normalizedReviews.reduce((sum, review) => sum + review.rating, 0) / normalizedReviews.length) * 10) / 10
    : 0;

  return {
    id,
    _id: id,
    name: tour.name,
    description: tour.description,
    bookingSummary: tour.bookingSummary || '',
    overview: tour.overview || '',
    price: tour.price,
    discountEnabled: Boolean(tour.discountEnabled || normalizedDiscountPrice !== null),
    discountPrice: normalizedDiscountPrice,
    groupDiscountEnabled: tour.groupDiscountEnabled === true,
    groupDiscount4: normalizeGroupDiscountValue(tour.groupDiscount4),
    groupDiscount5: normalizeGroupDiscountValue(tour.groupDiscount5),
    groupDiscount6Plus: normalizeGroupDiscountValue(tour.groupDiscount6Plus),
    currency: tour.currency || 'CHF',
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
    reviews: normalizedReviews,
    reviewCount: normalizedReviews.length,
    reviewAverage,
    avgRating: reviewAverage || tour.metadata?.rating || 0,
    rating: reviewAverage || tour.metadata?.rating || 0,
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

const normalizeListTour = (tour) => {
  const normalized = normalizeTour(tour);
  const firstImage = Array.isArray(normalized.images)
    ? normalized.images.find((image) => image && String(image).trim())
    : null;
  const isUrlImage = /^(https?:\/\/|\/(?!api\/)|\.\/)/i.test(String(firstImage || ''));
  const imageUrl = firstImage
    ? (isUrlImage ? firstImage : `/api/tours/${encodeURIComponent(String(normalized.id))}/image`)
    : '';

  return {
    ...normalized,
    thumbnail: imageUrl,
    images: imageUrl ? [imageUrl] : [],
  };
};

const setCacheHeaders = (res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
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
    const originalUrl = req.url || '';
    const queryString = originalUrl.includes('?') ? originalUrl.split('?').slice(1).join('?') : '';
    const queryParams = new URLSearchParams(queryString);
    let url = originalUrl;
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

    if (urlNormalized === '/api/admin/verify' && req.method === 'POST') {
      const passcode = body.passcode || req.headers['x-admin-passcode'] || req.headers['X-Admin-Passcode'] || '';
      if (!isValidAdminPasscode(passcode)) {
        return res.status(401).json({ success: false, error: 'Invalid passcode' });
      }
      return res.status(200).json({ success: true });
    }

    // Divisions API
    if (url.startsWith('/api/divisions')) {
      const divisionId = url.split('/api/divisions/')[1]?.split('?')[0];

      if (req.method === 'GET' && !divisionId) {
        const divisions = await Division.find({ isActive: true }).sort({ name: 1 });
        return res.json(divisions.map(div => ({
          id: div._id.toString(),
          _id: div._id.toString(),
          name: div.name,
          description: div.description,
          bannerImage: div.bannerImage,
          banner_image: div.bannerImage,
          isActive: div.isActive
        })));
      }
      if (req.method === 'POST' && !divisionId) {
        const header = req.headers['x-admin-passcode'] || req.headers['X-Admin-Passcode'];
        if (!isValidAdminPasscode(header)) {
          return res.status(401).json({ message: 'Invalid or missing admin passcode' });
        }
        const { name, description, bannerImage, banner_image } = body;
        if (!name) {
          return res.status(400).json({ message: 'Name is required' });
        }
        const division = new Division({
          name: String(name).trim(),
          description: description || '',
          bannerImage: bannerImage || banner_image || '',
        });
        await division.save();
        tourService.clearListCache();
        return res.status(201).json({
          id: division._id.toString(),
          _id: division._id.toString(),
          name: division.name,
          description: division.description,
          bannerImage: division.bannerImage,
          banner_image: division.bannerImage,
          isActive: division.isActive
        });
      }
      if ((req.method === 'PUT' || req.method === 'PATCH') && divisionId) {
        const header = req.headers['x-admin-passcode'] || req.headers['X-Admin-Passcode'];
        if (!isValidAdminPasscode(header)) {
          return res.status(401).json({ message: 'Invalid or missing admin passcode' });
        }
        const { name, description, bannerImage, banner_image } = body;
        if (!name) {
          return res.status(400).json({ message: 'Name is required' });
        }
        const division = await Division.findByIdAndUpdate(
          divisionId,
          {
            name: String(name).trim(),
            description: description || '',
            bannerImage: bannerImage || banner_image || '',
          },
          { new: true, runValidators: true }
        );
        if (!division) {
          return res.status(404).json({ message: 'Division not found' });
        }
        tourService.clearListCache();
        return res.json({
          id: division._id.toString(),
          _id: division._id.toString(),
          name: division.name,
          description: division.description,
          bannerImage: division.bannerImage,
          banner_image: division.bannerImage,
          isActive: division.isActive
        });
      }
      if (req.method === 'DELETE' && divisionId) {
        const header = req.headers['x-admin-passcode'] || req.headers['X-Admin-Passcode'];
        if (!isValidAdminPasscode(header)) {
          return res.status(401).json({ message: 'Invalid or missing admin passcode' });
        }
        const linkedTours = await Tour.countDocuments({ division: divisionId });
        if (linkedTours > 0) {
          return res.status(409).json({
            message: `This division is assigned to ${linkedTours} tour${linkedTours === 1 ? '' : 's'}. Move or delete those tours before removing the division.`
          });
        }
        const division = await Division.findByIdAndUpdate(
          divisionId,
          { isActive: false },
          { new: true }
        );
        if (!division) {
          return res.status(404).json({ message: 'Division not found' });
        }
        tourService.clearListCache();
        return res.json({
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
      const imageMatch = urlNormalized.match(/^\/api\/tours\/([^\/]+)\/image$/);
      const reviewMatch = urlNormalized.match(/^\/api\/tours\/([^\/]+)\/reviews$/);
      if (tourIdMatch) {
        tourId = tourIdMatch[1];
      }
      
      // Handle different HTTP methods
      switch (req.method) {
        case 'GET':
          if (imageMatch) {
            const image = await tourService.getTourImage(imageMatch[1], queryParams.get('index') || 0);

            if (image.redirectUrl) {
              res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800');
              res.writeHead(302, { Location: image.redirectUrl });
              return res.end();
            }

            if (image.updatedAt) {
              res.setHeader('Last-Modified', new Date(image.updatedAt).toUTCString());
            }
            res.setHeader('Content-Type', image.contentType);
            res.setHeader('Content-Length', image.buffer.length);
            res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800');
            return res.end(image.buffer);
          }

          if (tourId) {
            // GET single tour
            const cachedTour = tourByIdCache.get(tourId);
            if (cacheValid(cachedTour)) {
              setCacheHeaders(res);
              return res.json(cachedTour.data);
            }

            const tour = await Tour.findById(tourId)
              .select('name description bookingSummary price discountEnabled discountPrice groupDiscountEnabled groupDiscount4 groupDiscount5 groupDiscount6Plus currency images startLocation endLocation routeDetails division itinerary datePrices metadata startDate endDate minTicketsPerBooking maxTotalTickets isActive createdAt updatedAt reviews')
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
            if (urlNormalized === '/api/tours' && queryParams.get('full') !== 'true') {
              const tours = await tourService.getToursList({
                division: queryParams.get('division') || undefined,
                view: queryParams.get('view') || 'list',
                sort: queryParams.get('sort') || 'newest',
                limit: queryParams.get('limit') || 50,
              });
              setCacheHeaders(res);
              return res.json(tours);
            }

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
                .select('name description bookingSummary price discountEnabled discountPrice groupDiscountEnabled groupDiscount4 groupDiscount5 groupDiscount6Plus currency images startLocation endLocation routeDetails division itinerary datePrices metadata startDate endDate minTicketsPerBooking maxTotalTickets isActive createdAt updatedAt destination reviews')
                .slice('images', 1)
                .populate({ path: 'division', select: 'name', options: { lean: true } })
                .sort({ createdAt: -1 })
                .limit(6) // Only fetch what we need
                .lean({ virtuals: true });
              
              console.log('Found Switzerland tours:', tours.length);

              const transformedTours = tours.map(normalizeListTour);
              
              // Update cache with these tours
              toursCache = { data: transformedTours, expiresAt: nowTs + CACHE_TTL_MS };
              transformedTours.forEach((tour) => {
                tourByIdCache.set(tour.id, { data: tour, expiresAt: nowTs + SINGLE_CACHE_TTL_MS });
              });

              setCacheHeaders(res);
              return res.json(transformedTours);
            } else {
              const requestedDivision = queryParams.get('division');
              const requestedView = queryParams.get('view') || 'list';
              const requestedSort = queryParams.get('sort') || 'newest';
              const requestedLimit = queryParams.get('limit') || 50;

              if (requestedDivision) {
                const tours = await tourService.getToursList({
                  division: requestedDivision,
                  view: requestedView,
                  sort: requestedSort,
                  limit: requestedLimit,
                });
                setCacheHeaders(res);
                return res.json(tours);
              }

              // GET all tours
              const cachedList = cacheValid(toursCache) ? toursCache.data : null;
              if (cachedList) {
                setCacheHeaders(res);
                return res.json(cachedList);
              }

              console.log('Fetching all tours from database...');
              const nowTs = Date.now();
              const tours = await Tour.find({ isActive: true })
                .select('name description bookingSummary price discountEnabled discountPrice groupDiscountEnabled groupDiscount4 groupDiscount5 groupDiscount6Plus currency images startLocation endLocation routeDetails division itinerary datePrices metadata startDate endDate minTicketsPerBooking maxTotalTickets isActive createdAt updatedAt reviews')
                .slice('images', 1)
                .populate({ path: 'division', select: 'name', options: { lean: true } })
                .sort({ createdAt: -1 })
                .lean({ virtuals: true });
              console.log('Found tours:', tours.length);

              const transformedTours = tours.map(normalizeListTour);
              toursCache = { data: transformedTours, expiresAt: nowTs + CACHE_TTL_MS };
              transformedTours.forEach((tour) => {
                tourByIdCache.set(tour.id, { data: tour, expiresAt: nowTs + SINGLE_CACHE_TTL_MS });
              });

              setCacheHeaders(res);
              return res.json(transformedTours);
            }
          }
        case 'POST':
          if (reviewMatch) {
            const reviewTourId = reviewMatch[1];
            const rating = Number(body.rating);
            const userId = String(body.userId || '').trim();
            if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
              return res.status(400).json({ success: false, error: 'A star rating between 1 and 5 is required' });
            }
            if (!userId) {
              return res.status(400).json({ success: false, error: 'Login is required to write a review' });
            }
            if (!/^[0-9a-f]{24}$/i.test(userId)) {
              return res.status(400).json({ success: false, error: 'Login is required to write a review' });
            }
            const user = await User.findOne({ _id: userId, isActive: true }).select('name email').lean();
            if (!user) {
              return res.status(400).json({ success: false, error: 'Login is required to write a review' });
            }
            const tour = await Tour.findById(reviewTourId);
            if (!tour) return res.status(404).json({ success: false, error: 'Tour not found' });
            const existingReview = tour.reviews.find((review) => review.user?.toString?.() === user._id.toString());
            const reviewPayload = {
              user: user._id,
              userName: user.name || user.email,
              rating,
              description: String(body.description || '').trim().slice(0, 1000),
            };
            if (existingReview) {
              existingReview.userName = reviewPayload.userName;
              existingReview.rating = reviewPayload.rating;
              existingReview.description = reviewPayload.description;
              existingReview.updatedAt = new Date();
            } else {
              tour.reviews.push(reviewPayload);
            }
            await tour.save();
            const updatedTour = await Tour.findById(reviewTourId)
              .select('name description bookingSummary price discountEnabled discountPrice groupDiscountEnabled groupDiscount4 groupDiscount5 groupDiscount6Plus currency images startLocation endLocation routeDetails division itinerary datePrices metadata startDate endDate minTicketsPerBooking maxTotalTickets isActive createdAt updatedAt reviews')
              .populate({ path: 'division', select: 'name', options: { lean: true } })
              .lean({ virtuals: true });
            tourByIdCache.delete(reviewTourId);
            toursCache = { data: null, expiresAt: 0 };
            return res.status(201).json({ success: true, message: 'Review saved successfully', tour: normalizeTour(updatedTour) });
          }

          // POST create tour
          if (!tourId) { // Only for /api/tours (not /api/tours/:id)
            try {
              const header = req.headers['x-admin-passcode'] || req.headers['X-Admin-Passcode'];
              if (!isValidAdminPasscode(header)) {
                return res.status(401).json({ message: 'Invalid or missing admin passcode' });
              }

              const tour = await tourService.createTour(body);
              const normalizedTour = normalizeTour(tour);
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
            if (!isValidAdminPasscode(header)) {
              return res.status(401).json({ message: 'Invalid or missing admin passcode' });
            }

            const tour = await tourService.updateTour(tourId, body);
            const normalizedTour = normalizeTour(tour);
            invalidateTourCache(normalizedTour.id);

            return res.json({ success: true, tour: normalizedTour });
          }
          break;
          
        case 'DELETE':
          // DELETE tour
          if (tourId) {
            const header = req.headers['x-admin-passcode'] || req.headers['X-Admin-Passcode'];
            if (!isValidAdminPasscode(header)) {
              return res.status(401).json({ message: 'Invalid or missing admin passcode' });
            }

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
            if (!isValidAdminPasscode(header)) {
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
            if (!isValidAdminPasscode(header)) {
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
