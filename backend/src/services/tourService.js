/**
 * Tour Service
 * Business logic for tour operations
 */
const Tour = require('../../models/Tour');
const Division = require('../../models/Division');
const { getTourId, normalizeTourId, isValidObjectId } = require('../utils/tourId');
const mongoose = require('mongoose');

const LIST_CACHE_TTL_MS = 60 * 1000;
const listCache = new Map();

const clearTourListCache = () => {
  listCache.clear();
};

class TourService {
  /** First usable tour image for card views. Skip base64 blobs to keep list payloads small. */
  pickListImage(images) {
    const list = Array.isArray(images) ? images : images ? [images] : [];
    for (const image of list) {
      if (!image || typeof image !== 'string') continue;
      const value = image.trim();
      if (!value) continue;
      if (
        value.startsWith('http://') ||
        value.startsWith('https://') ||
        value.startsWith('/') ||
        value.startsWith('./')
      ) {
        return value;
      }
    }
    return null;
  }

  async getSwitzerlandDivision() {
    let division = await Division.findOne({ name: 'Switzerland' });
    if (!division) {
      division = await Division.create({
        name: 'Switzerland',
        description: 'Tours in Switzerland',
        isActive: true,
      });
    }
    return division;
  }

  normalizeTourUpdatePayload(updateData = {}, fallbackId = null, withDefaults = false) {
    const payload = { ...updateData };
    delete payload._id;
    delete payload.id;
    delete payload.__v;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.divisionName;

    if (payload.title && !payload.name) payload.name = payload.title;
    if (payload.desc && !payload.description) payload.description = payload.desc;
    if (payload.price !== undefined) payload.price = Number(payload.price || 0);

    if (withDefaults) {
      payload.name = payload.name || 'Switzerland Tour';
      payload.description = payload.description || payload.overview || '';
      payload.price = Number(payload.price || 0);
      payload.startDate = payload.startDate || new Date();
      payload.endDate = payload.endDate || payload.startDate || new Date();
      payload.startLocation = payload.startLocation || payload.address || 'Switzerland';
      payload.endLocation = payload.endLocation || payload.address || payload.startLocation || 'Switzerland';
    } else {
      ['startDate', 'endDate', 'startLocation', 'endLocation', 'division'].forEach((field) => {
        if (payload[field] === null || payload[field] === undefined || payload[field] === '') {
          delete payload[field];
        }
      });
    }

    payload.metadata = {
      ...(payload.metadata || {}),
      ...(fallbackId ? { staticId: String(fallbackId) } : {}),
    };

    return payload;
  }

  formatListTour(tour) {
    const id = tour.id || (tour._id ? tour._id.toString() : null);
    const divisionName =
      tour.divisionName ||
      (typeof tour.division === 'object' && tour.division?.name
        ? tour.division.name
        : null);

    const thumbnail = this.pickListImage(tour.images);

    const description =
      typeof tour.description === 'string'
        ? tour.description.slice(0, 280)
        : '';

    return {
      id,
      _id: id,
      name: tour.name,
      description,
      price: Number(tour.price) || 0,
      images: thumbnail ? [thumbnail] : [],
      startLocation: tour.startLocation,
      endLocation: tour.endLocation,
      duration: tour.duration,
      tourType: tour.tourType,
      division: tour.division,
      divisionName,
      rating: tour.metadata?.rating ?? tour.rating ?? 0,
      reviews: tour.metadata?.reviews ?? tour.reviews ?? 0,
      maxTotalTickets: tour.maxTotalTickets,
      createdAt: tour.createdAt,
    };
  }

  formatSearchTour(tour) {
    const id = tour.id || (tour._id ? tour._id.toString() : null);
    return {
      id,
      _id: id,
      name: tour.name,
      startLocation: tour.startLocation,
      price: Number(tour.price) || 0,
    };
  }

  /**
   * Lightweight list query for homepage / country pages (avoids huge base64 payloads).
   */
  async getToursList(options = {}) {
    const {
      division,
      limit = 50,
      sort = 'newest',
      view = 'list',
    } = options;

    const cacheKey = JSON.stringify({ division, limit, sort, view });
    const cached = listCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const match = { isActive: { $ne: false } };

    if (division) {
      const escaped = String(division).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const divisionDoc = await Division.findOne({
        name: { $regex: new RegExp(escaped, 'i') },
        isActive: { $ne: false },
      })
        .select('_id')
        .lean();

      if (divisionDoc) {
        match.division = divisionDoc._id;
      } else {
        listCache.set(cacheKey, { data: [], expiresAt: Date.now() + LIST_CACHE_TTL_MS });
        return [];
      }
    }

    const sortStage =
      sort === 'popular'
        ? { reviews: -1, rating: -1, createdAt: -1 }
        : { createdAt: -1 };

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'divisions',
          localField: 'division',
          foreignField: '_id',
          as: 'divisionDoc',
        },
      },
      {
        $addFields: {
          divisionName: { $ifNull: [{ $arrayElemAt: ['$divisionDoc.name', 0] }, ''] },
          firstImage: { $arrayElemAt: ['$images', 0] },
          rating: { $ifNull: ['$metadata.rating', 0] },
          reviews: { $ifNull: ['$metadata.reviews', 0] },
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          price: 1,
          startLocation: 1,
          endLocation: 1,
          duration: 1,
          tourType: 1,
          division: 1,
          divisionName: 1,
          rating: 1,
          reviews: 1,
          maxTotalTickets: 1,
          createdAt: 1,
          images: {
            $cond: [
              {
                $and: [
                  { $ne: ['$firstImage', null] },
                  { $not: [{ $regexMatch: { input: '$firstImage', regex: /^data:image\// } }] },
                ],
              },
              ['$firstImage'],
              [],
            ],
          },
        },
      },
      { $sort: sortStage },
      { $limit: safeLimit },
    ];

    const tours = await Tour.aggregate(pipeline);

    const formatted =
      view === 'search'
        ? tours.map((t) => this.formatSearchTour(t))
        : tours.map((t) => this.formatListTour(t));

    listCache.set(cacheKey, { data: formatted, expiresAt: Date.now() + LIST_CACHE_TTL_MS });
    return formatted;
  }

  /**
   * Get all tours
   * Uses single unified storage - Tour model arrays only (no separate collections)
   */
  async getAllTours() {
    try {
      const tours = await Tour.find({})
        .populate({
          path: 'division',
          select: 'name description',
          // Don't fail if division doesn't exist
          options: { lean: true }
        })
        .lean();
      
      // Ensure consistent IDs across all tours
      return tours.map(tour => {
        if (!tour.id && tour._id) {
          tour.id = tour._id.toString();
        }
        // Ensure arrays are always arrays (single storage method)
        tour.highlights = Array.isArray(tour.highlights) ? tour.highlights : [];
        tour.included = Array.isArray(tour.included) ? tour.included : [];
        tour.excluded = Array.isArray(tour.excluded) ? tour.excluded : [];
        tour.itinerary = Array.isArray(tour.itinerary) ? tour.itinerary : [];
        // Keep only the first image in list view to prevent giant payload sizes exceeding serverless limits
        if (Array.isArray(tour.images) && tour.images.length > 0) {
          tour.images = [tour.images[0]];
        } else {
          tour.images = [];
        }
        tour.pickupLocations = Array.isArray(tour.pickupLocations) ? tour.pickupLocations : [];
        // Ensure divisionName is set correctly
        if (tour.division) {
          if (typeof tour.division === 'object' && tour.division.name) {
            tour.divisionName = tour.division.name;
          } else {
            // Division is just an ID string - divisionName should already be populated
            tour.divisionName = tour.divisionName || null;
          }
        } else {
          tour.divisionName = tour.divisionName || null;
        }
        return tour;
      });
    } catch (error) {
      console.error('Error in getAllTours:', error);
      throw error;
    }
  }

  /**
   * Get tour by ID
   */
  async getTourById(id) {
    const tourId = normalizeTourId(id);
    
    if (!tourId) {
      throw new Error('Tour ID is required');
    }
    
    if (!isValidObjectId(tourId)) {
      const tour = await Tour.findOne({ 'metadata.staticId': tourId })
        .populate('division', 'name description')
        .lean();

      if (!tour) {
        throw new Error('Tour not found');
      }

      if (!tour.id && tour._id) {
        tour.id = tour._id.toString();
      }

      tour.highlights = Array.isArray(tour.highlights) ? tour.highlights : [];
      tour.included = Array.isArray(tour.included) ? tour.included : [];
      tour.excluded = Array.isArray(tour.excluded) ? tour.excluded : [];
      tour.itinerary = Array.isArray(tour.itinerary) ? tour.itinerary : [];
      tour.images = Array.isArray(tour.images) ? tour.images : [];
      tour.pickupLocations = Array.isArray(tour.pickupLocations) ? tour.pickupLocations : [];

      return tour;
    }
    
    const tour = await Tour.findById(tourId)
      .populate('division', 'name description')
      .lean();
    
    if (!tour) {
      throw new Error('Tour not found');
    }
    
    // Ensure both id and _id are present for frontend compatibility
    if (!tour.id && tour._id) {
      tour.id = tour._id.toString();
    }
    
    // Ensure arrays are always arrays (single storage method - Tour model only)
    tour.highlights = Array.isArray(tour.highlights) ? tour.highlights : [];
    tour.included = Array.isArray(tour.included) ? tour.included : [];
    tour.excluded = Array.isArray(tour.excluded) ? tour.excluded : [];
    tour.itinerary = Array.isArray(tour.itinerary) ? tour.itinerary : [];
    tour.images = Array.isArray(tour.images) ? tour.images : [];
    tour.pickupLocations = Array.isArray(tour.pickupLocations) ? tour.pickupLocations : [];
    
    return tour;
  }

  /**
   * Create tour
   */
  async createTour(tourData) {
    try {
      // Validate division exists
      const Division = require('../../models/Division');
      const division = await Division.findById(tourData.division);
      if (!division) {
        throw new Error('Division not found. Please create a division first.');
      }

      // Ensure required fields
      if (!tourData.name || !tourData.name.trim()) {
        throw new Error('Tour name is required');
      }
      
      if (!tourData.price || Number(tourData.price) < 0) {
        throw new Error('Valid price is required');
      }
      
      if (!tourData.startLocation || !tourData.startLocation.trim()) {
        throw new Error('Start location is required');
      }
      
      if (!tourData.endLocation || !tourData.endLocation.trim()) {
        throw new Error('End location is required');
      }

      // Prepare tour payload with proper defaults
      const tourPayload = {
        division: tourData.division,
        name: String(tourData.name).trim(),
        description: tourData.description ? String(tourData.description).trim() : '',
        overview: tourData.overview ? String(tourData.overview).trim() : '',
        price: Number(tourData.price),
        startLocation: String(tourData.startLocation).trim(),
        endLocation: String(tourData.endLocation).trim(),
        routeDetails: tourData.routeDetails ? String(tourData.routeDetails).trim() : '',
        // Ensure arrays are arrays
        highlights: Array.isArray(tourData.highlights) ? tourData.highlights : [],
        included: Array.isArray(tourData.included) ? tourData.included : [],
        excluded: Array.isArray(tourData.excluded) ? tourData.excluded : [],
        itinerary: Array.isArray(tourData.itinerary) ? tourData.itinerary : [],
        images: Array.isArray(tourData.images) ? tourData.images : [],
        pickupLocations: Array.isArray(tourData.pickupLocations) ? tourData.pickupLocations : [],
        // Ensure dates are Date objects
        startDate: tourData.startDate ? new Date(tourData.startDate) : new Date(),
        endDate: tourData.endDate ? new Date(tourData.endDate) : new Date(Date.now() + 24 * 60 * 60 * 1000),
        // Optional fields with defaults
        duration: tourData.duration ? String(tourData.duration).trim() : '12 hours',
        tourType: tourData.tourType ? String(tourData.tourType).trim() : 'Day Tour, Private Tour',
        reviewText: tourData.reviewText ? String(tourData.reviewText).trim() : 'No reviews yet',
        minTicketsPerBooking: tourData.minTicketsPerBooking ? Number(tourData.minTicketsPerBooking) : 1,
        maxTotalTickets: tourData.maxTotalTickets ? Number(tourData.maxTotalTickets) : null,
        datePrices: tourData.datePrices && typeof tourData.datePrices === 'object' ? tourData.datePrices : {},
        metadata: tourData.metadata && typeof tourData.metadata === 'object' ? tourData.metadata : {},
        isActive: tourData.isActive !== undefined ? Boolean(tourData.isActive) : true,
      };
      
      const tour = new Tour(tourPayload);
      await tour.save();
      await tour.populate('division', 'name description');
      
      const tourObj = tour.toObject({ virtuals: true });
      // Ensure both id and _id are present
      if (!tourObj.id && tourObj._id) {
        tourObj.id = tourObj._id.toString();
      }
      
      // Ensure divisionName is set
      if (tourObj.division) {
        tourObj.divisionName = typeof tourObj.division === 'object' 
          ? tourObj.division.name || tourObj.division 
          : tourObj.division;
      }
      
      return tourObj;
    } catch (error) {
      console.error('Error creating tour:', error);
      // Re-throw with better message
      if (error.message.includes('Division not found')) {
        throw new Error('Division not found. Please create a division first.');
      }
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(e => e.message);
        throw new Error(`Validation error: ${errors.join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Update tour
   */
  async updateTour(id, updateData) {
    const tourId = normalizeTourId(id);
    
    if (!isValidObjectId(tourId)) {
      const division = await this.getSwitzerlandDivision();
      const payload = this.normalizeTourUpdatePayload(updateData, tourId, true);
      payload.division = division._id;

      const query = {
        $or: [
          { 'metadata.staticId': tourId },
          { name: payload.name, division: division._id },
        ],
      };

      const tour = await Tour.findOneAndUpdate(
        query,
        { $set: payload },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      ).populate('division', 'name description');

      const tourObj = tour.toObject({ virtuals: true });
      if (!tourObj.id && tourObj._id) {
        tourObj.id = tourObj._id.toString();
      }

      clearTourListCache();
      return tourObj;
    }
    
    const payload = this.normalizeTourUpdatePayload(updateData);
    const tour = await Tour.findByIdAndUpdate(
      tourId,
      payload,
      { new: true, runValidators: true }
    ).populate('division', 'name description');
    
    if (!tour) {
      throw new Error('Tour not found');
    }

    clearTourListCache();
    
    const tourObj = tour.toObject({ virtuals: true });
    if (!tourObj.id && tourObj._id) {
      tourObj.id = tourObj._id.toString();
    }
    
    return tourObj;
  }

  /**
   * Delete tour
   */
  async deleteTour(id) {
    const tourId = normalizeTourId(id);
    
    if (!isValidObjectId(tourId)) {
      throw new Error('Invalid tour ID format');
    }
    
    const tour = await Tour.findByIdAndDelete(tourId);
    
    if (!tour) {
      throw new Error('Tour not found');
    }
    
    return { success: true, message: 'Tour deleted successfully' };
  }
}

module.exports = new TourService();
