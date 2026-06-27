/**
 * Tour Service
 * Business logic for tour operations
 */
const Tour = require('../../models/Tour');
const Division = require('../../models/Division');
const User = require('../../models/User');
const { getTourId, normalizeTourId, isValidObjectId } = require('../utils/tourId');
const {
  getTourImageEndpoint,
  getTourThumbnail,
  getTourImageDebugPayload,
  getMigratedTourImages,
  stripDataImages,
} = require('../utils/tourImages');
const mongoose = require('mongoose');

const listCache = new Map();

const clearTourListCache = () => {
  listCache.clear();
};

const normalizeDatePrices = (datePrices) => {
  if (!datePrices) return {};
  if (datePrices instanceof Map) return Object.fromEntries(datePrices);
  if (Array.isArray(datePrices)) {
    return datePrices.reduce((acc, entry) => {
      if (!entry || !entry.date) return acc;
      const price = Number(entry.price);
      if (Number.isFinite(price)) {
        acc[String(entry.date)] = price;
      }
      return acc;
    }, {});
  }
  if (typeof datePrices === 'object') {
    return Object.entries(datePrices).reduce((acc, [date, price]) => {
      const numericPrice = Number(price);
      if (date && Number.isFinite(numericPrice)) {
        acc[date] = numericPrice;
      }
      return acc;
    }, {});
  }
  return {};
};

const cleanTextArray = (items) => (
  Array.isArray(items)
    ? items.map((item) => String(item || '').trim()).filter(Boolean)
    : []
);

const normalizeImageValue = (image) => {
  if (!image || typeof image !== 'string') return null;
  const value = image.trim();
  if (!value) return null;
  return /^(https?:\/\/|\/|\.\/|data:image\/(webp|avif);base64,)/i.test(value) ? value : null;
};

const normalizeImages = (images) => {
  const list = Array.isArray(images) ? images : images ? [images] : [];
  return list.map(normalizeImageValue).filter(Boolean);
};

const normalizeOptionalImageValue = (image) => {
  if (image && typeof image === 'object') return image;
  return normalizeImageValue(image);
};

const cleanTourName = (value) => (
  String(value || '')
    .replace(/^[\s,،;:]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
);

const normalizeDivisionKey = (value) => (
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
);

const getDivisionInputValue = (value) => {
  if (!value) return '';
  if (typeof value === 'object') {
    return value._id || value.id || value.name || '';
  }
  return value;
};

const parseImageDataUrl = (value = '') => {
  const match = String(value || '').match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) return null;

  return {
    contentType: match[1].toLowerCase(),
    buffer: Buffer.from(match[2], 'base64'),
  };
};

const readStoredImageValue = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') {
    return readStoredImageValue(value.url || value.secure_url || value.src || value.path || value.imageUrl);
  }
  return '';
};

const collectStoredImages = (tour = {}) => {
  const fields = [
    tour.images,
    tour.thumbnail,
    tour.cardImage,
    tour.coverImage,
    tour.gallery,
    tour.media,
  ];

  return fields
    .flatMap((field) => (Array.isArray(field) ? field : field ? [field] : []))
    .map(readStoredImageValue)
    .filter(Boolean);
};

const pickStoredImage = (tour = {}, imageIndex = 0) => {
  const images = collectStoredImages(tour);
  const index = Math.max(0, Number(imageIndex) || 0);
  return images[index] || images.find(Boolean) || '';
};

const normalizeItinerary = (items) => (
  Array.isArray(items)
    ? items
        .map((item) => {
          if (!item || typeof item !== 'object') return null;
          const normalized = {
            title: item.title ? String(item.title).trim() : undefined,
            description: item.description ? String(item.description).trim() : undefined,
            duration: item.duration ? String(item.duration).trim() : undefined,
            location: item.location ? String(item.location).trim() : undefined,
            type: item.type ? String(item.type).trim() : undefined,
            activities: cleanTextArray(item.activities),
          };
          Object.keys(normalized).forEach((key) => {
            if (
              normalized[key] === undefined ||
              (Array.isArray(normalized[key]) && normalized[key].length === 0)
            ) {
              delete normalized[key];
            }
          });
          return Object.keys(normalized).length ? normalized : null;
        })
        .filter(Boolean)
    : []
);

const formatReview = (review) => {
  if (!review) return null;
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
};

const getReviewSummary = (tour = {}) => {
  const reviews = Array.isArray(tour.reviews)
    ? tour.reviews.map(formatReview).filter(Boolean)
    : [];
  const count = reviews.length;
  const average = count
    ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / count) * 10) / 10
    : 0;

  return {
    reviews,
    reviewCount: count,
    reviewAverage: average,
  };
};

const applyReviewSummary = (tour = {}) => {
  const summary = getReviewSummary(tour);
  tour.reviews = summary.reviews;
  tour.reviewCount = summary.reviewCount;
  tour.reviewAverage = summary.reviewAverage;
  tour.avgRating = summary.reviewAverage || tour.metadata?.rating || 0;
  tour.rating = summary.reviewAverage || tour.metadata?.rating || 0;
  return tour;
};

const getRawDiscountPrice = (tour = {}) => (
  tour.discountPrice ??
  tour.discountedPrice ??
  tour.salePrice ??
  tour.metadata?.discountPrice ??
  tour.metadata?.discountedPrice ??
  tour.metadata?.salePrice ??
  tour.metadata?.discount?.price ??
  null
);

const getNormalizedDiscountPrice = (tour = {}) => {
  const rawDiscountPrice = getRawDiscountPrice(tour);
  if (rawDiscountPrice === null || rawDiscountPrice === undefined || rawDiscountPrice === '') return null;

  const discountPrice = Number(rawDiscountPrice);
  return Number.isFinite(discountPrice) && discountPrice >= 0 ? discountPrice : null;
};

const getDiscountFields = (tour = {}) => {
  const discountPrice = getNormalizedDiscountPrice(tour);
  return {
    discountEnabled: tour.discountEnabled === true || discountPrice !== null,
    discountPrice,
  };
};

const normalizeGroupDiscountValue = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.min(100, number) : null;
};

const getGroupDiscountFields = (tour = {}) => ({
  groupDiscountEnabled: tour.groupDiscountEnabled === true,
  groupDiscount4: normalizeGroupDiscountValue(tour.groupDiscount4),
  groupDiscount5: normalizeGroupDiscountValue(tour.groupDiscount5),
  groupDiscount6Plus: normalizeGroupDiscountValue(tour.groupDiscount6Plus),
});

class TourService {
  /** First usable tour image for card views. */
  pickListImage(images) {
    const list = Array.isArray(images) ? images : images ? [images] : [];
    for (const image of list) {
      if (!image || typeof image !== 'string') continue;
      const value = image.trim();
      if (!value) continue;
      if (/^(https?:\/\/|\/|\.\/|data:image\/(webp|avif);base64,)/i.test(value)) {
        return value;
      }
    }
    return null;
  }

  getImageEndpoint(id) {
    return id ? `/api/tours/${encodeURIComponent(String(id))}/image` : '';
  }

  buildSlug(tour = {}, id = '') {
    const raw = tour.slug || tour.metadata?.slug || tour.metadata?.staticId || tour.name || id;
    return String(raw || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || String(id || '');
  }

  clearListCache() {
    clearTourListCache();
  }

  async getSwitzerlandDivision() {
    let division = await Division.findOne({
      name: { $regex: /^Switzerland$/i },
      isActive: { $ne: false },
    });
    if (!division) {
      division = await Division.create({
        name: 'Switzerland',
        description: 'Tours in Switzerland',
        isActive: true,
      });
    }
    return division;
  }

  async resolveDivision(divisionInput) {
    const value = getDivisionInputValue(divisionInput);
    if (!value) return null;

    if (mongoose.Types.ObjectId.isValid(String(value))) {
      return Division.findOne({
        _id: value,
        isActive: { $ne: false },
      });
    }

    const requestedKey = normalizeDivisionKey(value);
    if (!requestedKey) return null;

    const divisions = await Division.find({ isActive: { $ne: false } })
      .select('_id name description')
      .lean();

    const matched = divisions.find((division) => normalizeDivisionKey(division.name) === requestedKey);
    if (!matched) return null;

    return Division.findById(matched._id);
  }

  async resolveDivisionIds(divisionInput) {
    const value = getDivisionInputValue(divisionInput);
    if (!value) return [];

    if (mongoose.Types.ObjectId.isValid(String(value))) {
      const division = await Division.findById(value).select('_id').lean();
      return division ? [division._id] : [];
    }

    const requestedKey = normalizeDivisionKey(value);
    if (!requestedKey) return [];

    const divisions = await Division.find({})
      .select('_id name')
      .lean();

    return divisions
      .filter((division) => normalizeDivisionKey(division.name) === requestedKey)
      .map((division) => division._id);
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
    if (payload.name !== undefined) payload.name = cleanTourName(payload.name);
    if (payload.title !== undefined) payload.title = cleanTourName(payload.title);
    if (payload.price !== undefined) payload.price = Number(payload.price);
    if (payload.discountEnabled !== undefined) payload.discountEnabled = Boolean(payload.discountEnabled);
    if (payload.discountPrice !== undefined) {
      if (payload.discountPrice === null || payload.discountPrice === '') {
        payload.discountPrice = null;
      } else {
        const discountPrice = Number(payload.discountPrice);
        payload.discountPrice = Number.isFinite(discountPrice) && discountPrice >= 0 ? discountPrice : null;
      }
    }
    if (payload.discountPrice !== undefined && payload.discountEnabled === undefined) {
      payload.discountEnabled = payload.discountPrice !== null;
    }
    if (payload.groupDiscountEnabled !== undefined) {
      payload.groupDiscountEnabled = Boolean(payload.groupDiscountEnabled);
    }
    ['groupDiscount4', 'groupDiscount5', 'groupDiscount6Plus'].forEach((field) => {
      if (payload[field] === undefined) return;
      payload[field] = normalizeGroupDiscountValue(payload[field]);
    });
    if (payload.groupDiscountEnabled === false) {
      payload.groupDiscount4 = null;
      payload.groupDiscount5 = null;
      payload.groupDiscount6Plus = null;
    }
    if (payload.currency !== undefined) payload.currency = String(payload.currency || 'CHF').trim().toUpperCase() || 'CHF';
    if (payload.minTicketsPerBooking !== undefined) {
      const minTickets = Number(payload.minTicketsPerBooking);
      payload.minTicketsPerBooking = Number.isInteger(minTickets) && minTickets > 0 ? minTickets : 1;
    }
    if (payload.maxTotalTickets !== undefined && payload.maxTotalTickets !== null && payload.maxTotalTickets !== '') {
      const maxTickets = Number(payload.maxTotalTickets);
      if (Number.isInteger(maxTickets) && maxTickets > 0) {
        payload.maxTotalTickets = maxTickets;
      } else {
        delete payload.maxTotalTickets;
      }
    }
    if (payload.datePrices !== undefined) payload.datePrices = normalizeDatePrices(payload.datePrices);
    if (payload.images !== undefined) payload.images = normalizeImages(payload.images);
    if (payload.thumbnail !== undefined) payload.thumbnail = normalizeImageValue(payload.thumbnail);
    if (payload.cardImage !== undefined) payload.cardImage = normalizeImageValue(payload.cardImage);
    if (payload.coverImage !== undefined) payload.coverImage = normalizeOptionalImageValue(payload.coverImage);
    if (payload.gallery !== undefined) {
      payload.gallery = Array.isArray(payload.gallery)
        ? payload.gallery.map(normalizeOptionalImageValue).filter(Boolean)
        : [];
    }
    if (payload.media !== undefined) {
      payload.media = Array.isArray(payload.media)
        ? payload.media.map(normalizeOptionalImageValue).filter(Boolean)
        : [];
    }
    if (payload.highlights !== undefined) payload.highlights = cleanTextArray(payload.highlights);
    if (payload.included !== undefined) payload.included = cleanTextArray(payload.included);
    if (payload.excluded !== undefined) payload.excluded = cleanTextArray(payload.excluded);
    if (payload.itinerary !== undefined) payload.itinerary = normalizeItinerary(payload.itinerary);
    if (payload.pickupLocations !== undefined) {
      payload.pickupLocations = Array.isArray(payload.pickupLocations)
        ? payload.pickupLocations
            .map((item) => ({
              name: item?.name ? String(item.name).trim() : '',
              description: item?.description ? String(item.description).trim() : '',
            }))
            .filter((item) => item.name || item.description)
        : [];
    }
    if (payload.metadata?.datePrices !== undefined) {
      payload.metadata = {
        ...payload.metadata,
        datePrices: normalizeDatePrices(payload.metadata.datePrices),
      };
    }

    ['startDate', 'endDate', 'startLocation', 'endLocation', 'division'].forEach((field) => {
      if (payload[field] === null || payload[field] === undefined || payload[field] === '') {
        delete payload[field];
      }
    });

    ['description', 'overview', 'bookingSummary', 'routeDetails', 'duration', 'tourType', 'reviewText'].forEach((field) => {
      if (payload[field] !== undefined) {
        const value = String(payload[field]).trim();
        payload[field] = field === 'bookingSummary' ? value.slice(0, 400) || null : value || null;
      }
    });

    if (payload.metadata !== undefined && (!payload.metadata || typeof payload.metadata !== 'object')) {
      delete payload.metadata;
    }

    if (fallbackId) {
      payload.metadata = {
        ...(payload.metadata || {}),
        staticId: String(fallbackId),
      };
    }

    return payload;
  }

  formatListTour(tour) {
    const id = tour.id || (tour._id ? tour._id.toString() : null);
    const divisionName =
      tour.divisionName ||
      (typeof tour.division === 'object' && tour.division?.name
        ? tour.division.name
        : null);

    const reviewSummary = getReviewSummary(tour);
    const legacyReviewCount = Number(tour.metadata?.reviews ?? tour.reviews);
    const legacyRating = Number(tour.metadata?.rating ?? tour.rating);
    const thumbnail = getTourThumbnail(tour);
    const shortSummary = String(tour.shortSummary || '').trim().slice(0, 240);

    return {
      id,
      _id: id,
      slug: this.buildSlug(tour, id),
      name: tour.name,
      title: tour.name,
      location: tour.startLocation || divisionName || '',
      shortSummary,
      description: shortSummary,
      price: Number(tour.price) || 0,
      ...getDiscountFields(tour),
      ...getGroupDiscountFields(tour),
      currency: tour.currency || 'CHF',
      duration: tour.duration || '',
      startLocation: tour.startLocation,
      divisionName,
      rating: reviewSummary.reviewAverage || (Number.isFinite(legacyRating) ? legacyRating : 0),
      reviewCount: reviewSummary.reviewCount || (Number.isFinite(legacyReviewCount) ? legacyReviewCount : 0),
      thumbnail,
      isActive: tour.isActive !== false,
    };
  }

  formatSummaryTour(tour) {
    const id = tour.id || (tour._id ? tour._id.toString() : null);
    const divisionName =
      tour.divisionName ||
      (typeof tour.division === 'object' && tour.division?.name
        ? tour.division.name
        : null);
    const legacyRating = Number(tour.metadata?.rating ?? tour.rating);
    const thumbnail = getTourThumbnail(tour);
    const shortSummary = String(tour.shortSummary || '').trim().slice(0, 240);

    return {
      _id: id,
      id,
      slug: this.buildSlug(tour, id),
      title: tour.name || '',
      name: tour.name || '',
      location: tour.startLocation || divisionName || '',
      shortSummary,
      description: shortSummary,
      price: Number(tour.price) || 0,
      ...getDiscountFields(tour),
      ...getGroupDiscountFields(tour),
      currency: tour.currency || 'CHF',
      duration: tour.duration || '',
      startLocation: tour.startLocation || '',
      thumbnail,
      rating: Number.isFinite(legacyRating) ? legacyRating : 0,
      reviewCount: Number(tour.metadata?.reviews ?? tour.reviews) || 0,
      divisionName,
      isActive: tour.isActive !== false,
    };
  }

  async getTourImage(id, imageIndex = 0) {
    const tourId = normalizeTourId(id);

    if (!tourId) {
      throw new Error('Tour ID is required');
    }

    const migratedImage = getMigratedTourImages(tourId)[Math.max(0, Number(imageIndex) || 0)];
    if (migratedImage) {
      return { redirectUrl: migratedImage };
    }

    const query = isValidObjectId(tourId)
      ? { _id: tourId }
      : { 'metadata.staticId': tourId };

    const tour = await Tour.findOne(query)
      .select('images thumbnail cardImage coverImage gallery media updatedAt')
      .lean();

    if (!tour) {
      throw new Error('Tour not found');
    }

    const image = pickStoredImage(tour, imageIndex);

    if (!image) {
      throw new Error('Tour image not found');
    }

    if (/^https?:\/\//i.test(image)) {
      return { redirectUrl: image };
    }

    const parsed = parseImageDataUrl(image);
    if (!parsed) {
      throw new Error('Unsupported tour image format');
    }

    return {
      ...parsed,
      updatedAt: tour.updatedAt,
    };
  }

  formatSearchTour(tour) {
    const id = tour.id || (tour._id ? tour._id.toString() : null);
    return {
      id,
      _id: id,
      slug: this.buildSlug(tour, id),
      name: tour.name,
      title: tour.name,
      thumbnail: getTourThumbnail(tour),
      startLocation: tour.startLocation,
      location: tour.startLocation,
      divisionName: tour.divisionName,
      price: Number(tour.price) || 0,
      ...getDiscountFields(tour),
      ...getGroupDiscountFields(tour),
      isActive: tour.isActive !== false,
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

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const match = { isActive: { $ne: false } };

    if (division) {
      const divisionIds = await this.resolveDivisionIds(division);

      if (divisionIds.length) {
        match.division = { $in: divisionIds };
      } else {
        return [];
      }
    }

    const sortStage =
      sort === 'popular'
        ? { reviewCountValue: -1, reviewRatingValue: -1, createdAt: -1 }
        : { createdAt: -1 };

    const pipeline = [
      { $match: match },
      // Tour documents can contain large base64 image payloads. Drop those fields
      // before sorting so MongoDB does not have to keep the full documents in the
      // aggregation sort buffer (which is capped at 32 MB on the hosted database).
      {
        $project: {
          name: 1,
          bookingSummary: 1,
          description: 1,
          price: 1,
          currency: 1,
          discountEnabled: 1,
          discountPrice: 1,
          groupDiscountEnabled: 1,
          groupDiscount4: 1,
          groupDiscount5: 1,
          groupDiscount6Plus: 1,
          startLocation: 1,
          endLocation: 1,
          duration: 1,
          tourType: 1,
          division: 1,
          reviews: 1,
          maxTotalTickets: 1,
          isActive: 1,
          'metadata.staticId': 1,
          'metadata.slug': 1,
          'metadata.reviews': 1,
          'metadata.rating': 1,
          imageCount: { $size: { $ifNull: ['$images', []] } },
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $addFields: {
          reviewCountValue: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ['$reviews', []] } }, 0] },
              { $size: { $ifNull: ['$reviews', []] } },
              { $ifNull: ['$metadata.reviews', 0] },
            ],
          },
          reviewRatingValue: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ['$reviews', []] } }, 0] },
              { $avg: '$reviews.rating' },
              { $ifNull: ['$metadata.rating', 0] },
            ],
          },
        },
      },
      { $sort: sortStage },
      { $limit: safeLimit },
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
          rating: '$reviewRatingValue',
          reviews: '$reviewCountValue',
          shortSummary: {
            $substrCP: [
              { $ifNull: ['$bookingSummary', { $ifNull: ['$description', ''] }] },
              0,
              240,
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          shortSummary: 1,
          price: 1,
          currency: 1,
          discountEnabled: 1,
          discountPrice: 1,
          groupDiscountEnabled: 1,
          groupDiscount4: 1,
          groupDiscount5: 1,
          groupDiscount6Plus: 1,
          startLocation: 1,
          endLocation: 1,
          duration: 1,
          tourType: 1,
          division: 1,
          divisionName: 1,
          rating: 1,
          reviews: 1,
          maxTotalTickets: 1,
          isActive: 1,
          'metadata.staticId': 1,
          'metadata.slug': 1,
          imageCount: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ];

    const tours = await Tour.aggregate(pipeline);

    const formatted =
      view === 'search'
        ? tours.map((t) => this.formatSearchTour(t))
        : view === 'summary'
          ? tours.map((t) => this.formatSummaryTour(t))
          : tours.map((t) => this.formatListTour(t));

    const deduped = this.dedupeTours(formatted);
    return deduped;
  }

  dedupeTours(tours = []) {
    const byKey = new Map();
    const withoutStableKey = [];

    for (const tour of tours) {
      const id = tour.id || (tour._id ? String(tour._id) : '');
      const staticId = tour.metadata?.staticId ? String(tour.metadata.staticId) : '';
      const keys = [id, staticId].filter(Boolean);

      if (!keys.length) {
        withoutStableKey.push(tour);
        continue;
      }

      const existing = keys.map((key) => byKey.get(key)).find(Boolean);

      if (!existing) {
        keys.forEach((key) => byKey.set(key, tour));
        continue;
      }

      const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      const tourTime = new Date(tour.updatedAt || tour.createdAt || 0).getTime();

      if (tourTime >= existingTime) {
        keys.forEach((key) => byKey.set(key, tour));
      }
    }

    return [
      ...new Map([...byKey.values()].map((tour) => [tour.id || tour._id, tour])).values(),
      ...withoutStableKey,
    ];
  }

  /**
   * Get all tours
   * Uses single unified storage - Tour model arrays only (no separate collections)
   */
  async getAllTours() {
    try {
      const tours = await Tour.find({})
        .select('-images')
        .populate({
          path: 'division',
          select: 'name description',
          // Don't fail if division doesn't exist
          options: { lean: true }
        })
        .lean();
      
      const normalizedTours = tours.map(tour => {
        const migratedImages = getMigratedTourImages(tour);
        if (process.env.DEBUG_TOUR_IMAGES === 'true') {
          console.log('Tour image debug', getTourImageDebugPayload(tour));
        }
        if (!tour.id && tour._id) {
          tour.id = tour._id.toString();
        }
        // Ensure arrays are always arrays (single storage method)
        tour.highlights = Array.isArray(tour.highlights) ? tour.highlights : [];
        tour.included = Array.isArray(tour.included) ? tour.included : [];
        tour.excluded = Array.isArray(tour.excluded) ? tour.excluded : [];
        tour.itinerary = Array.isArray(tour.itinerary) ? tour.itinerary : [];
        tour.images = migratedImages;
        tour.thumbnail = getTourThumbnail(tour);
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

      const missingImageIds = normalizedTours
        .filter((tour) => !tour.images.length)
        .map((tour) => tour._id)
        .filter(Boolean);

      if (missingImageIds.length) {
        const fallbackImages = await Tour.find({ _id: { $in: missingImageIds } })
          .select('images')
          .lean();
        const imageMap = new Map(fallbackImages.map((tour) => [
          String(tour._id),
          stripDataImages(tour.images, tour._id),
        ]));

        normalizedTours.forEach((tour) => {
          if (!tour.images.length) {
            tour.images = imageMap.get(String(tour._id)) || [];
            tour.thumbnail = getTourThumbnail(tour);
          }
        });
      }

      return this.dedupeTours(normalizedTours);
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
        .select('-images')
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
      if (process.env.DEBUG_TOUR_IMAGES === 'true') {
        console.log('Tour image debug', getTourImageDebugPayload(tour));
      }
      tour.images = getMigratedTourImages(tour);
      if (!tour.images.length) {
        const imageDoc = await Tour.findById(tour._id).select('images').lean();
        tour.images = stripDataImages(imageDoc?.images, tour.id || tour._id);
      }
      tour.thumbnail = getTourThumbnail(tour);
      tour.pickupLocations = Array.isArray(tour.pickupLocations) ? tour.pickupLocations : [];

      return applyReviewSummary(tour);
    }
    
    const tour = await Tour.findById(tourId)
      .select('-images')
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
    if (process.env.DEBUG_TOUR_IMAGES === 'true') {
      console.log('Tour image debug', getTourImageDebugPayload(tour));
    }
    tour.images = getMigratedTourImages(tour);
    if (!tour.images.length) {
      const imageDoc = await Tour.findById(tourId).select('images').lean();
      tour.images = stripDataImages(imageDoc?.images, tour.id || tour._id);
    }
    tour.thumbnail = getTourThumbnail(tour);
    tour.pickupLocations = Array.isArray(tour.pickupLocations) ? tour.pickupLocations : [];
    
    return applyReviewSummary(tour);
  }

  async addTourReview(id, reviewData = {}) {
    const tourId = normalizeTourId(id);
    if (!tourId) {
      throw new Error('Tour ID is required');
    }

    const rating = Number(reviewData.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('A star rating between 1 and 5 is required');
    }

    const userId = String(reviewData.userId || '').trim();
    let user = null;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findOne({ _id: userId, isActive: true }).select('name email').lean();
    }

    const submittedName = String(reviewData.userName || '').trim().slice(0, 100);
    const userName = submittedName || (user ? (user.name || user.email) : '');
    if (!userName) {
      throw new Error('Your name is required to write a review');
    }

    const tour = isValidObjectId(tourId)
      ? await Tour.findById(tourId)
      : await Tour.findOne({ 'metadata.staticId': tourId });

    if (!tour) {
      throw new Error('Tour not found');
    }

    const description = String(reviewData.description || '').trim().slice(0, 1000);
    const reviewPayload = {
      user: user?._id || null,
      userName,
      rating,
      description,
    };

    const existingReview = user
      ? tour.reviews.find((review) => review.user?.toString?.() === user._id.toString())
      : null;

    if (existingReview) {
      existingReview.userName = reviewPayload.userName;
      existingReview.rating = reviewPayload.rating;
      existingReview.description = reviewPayload.description;
      existingReview.updatedAt = new Date();
    } else {
      tour.reviews.push(reviewPayload);
    }

    const reviewRatings = tour.reviews
      .map((review) => Number(review.rating))
      .filter(Number.isFinite);
    tour.metadata = {
      ...(tour.metadata || {}),
      reviews: reviewRatings.length,
      rating: reviewRatings.length
        ? Math.round((reviewRatings.reduce((sum, value) => sum + value, 0) / reviewRatings.length) * 10) / 10
        : 0,
    };
    tour.markModified('metadata');
    await tour.save();
    clearTourListCache();
    return this.getTourById(tour._id);
  }

  /**
   * Create tour
   */
  async createTour(tourData) {
    try {
      let division = await this.resolveDivision(tourData.division);

      if (!division) {
        if (tourData.division) {
          throw new Error('Division not found. Please create a division first.');
        }
        division = await this.getSwitzerlandDivision();
      }

      // Ensure required fields
      if (!tourData.name || !tourData.name.trim()) {
        throw new Error('Tour name is required');
      }
      
      if (tourData.price === undefined || tourData.price === null || tourData.price === '' || Number(tourData.price) < 0) {
        throw new Error('Valid price is required');
      }
      
      if (!tourData.startLocation || !tourData.startLocation.trim()) {
        throw new Error('Start location is required');
      }
      
      if (!tourData.endLocation || !tourData.endLocation.trim()) {
        throw new Error('End location is required');
      }

      const optionalText = (value) => (value ? String(value).trim() : undefined);
      const optionalNumber = (value) => {
        if (value === undefined || value === null || value === '') return undefined;
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : undefined;
      };

      // Prepare tour payload. MongoDB receives only admin-provided tour details.
      const tourPayload = {
        division: division._id,
        name: cleanTourName(tourData.name),
        description: optionalText(tourData.description) || null,
        overview: optionalText(tourData.overview) || null,
        bookingSummary: optionalText(tourData.bookingSummary)?.slice(0, 400) || null,
        price: Number(tourData.price),
        discountEnabled: Boolean(tourData.discountEnabled || optionalNumber(tourData.discountPrice) !== undefined),
        discountPrice: optionalNumber(tourData.discountPrice),
        groupDiscountEnabled: Boolean(tourData.groupDiscountEnabled),
        groupDiscount4: tourData.groupDiscountEnabled ? optionalNumber(tourData.groupDiscount4) : null,
        groupDiscount5: tourData.groupDiscountEnabled ? optionalNumber(tourData.groupDiscount5) : null,
        groupDiscount6Plus: tourData.groupDiscountEnabled ? optionalNumber(tourData.groupDiscount6Plus) : null,
        startLocation: String(tourData.startLocation).trim(),
        endLocation: String(tourData.endLocation).trim(),
        routeDetails: optionalText(tourData.routeDetails) || null,
        // Ensure arrays are arrays
        highlights: cleanTextArray(tourData.highlights),
        included: cleanTextArray(tourData.included),
        excluded: cleanTextArray(tourData.excluded),
        itinerary: normalizeItinerary(tourData.itinerary),
        images: normalizeImages(tourData.images),
        thumbnail: normalizeImageValue(tourData.thumbnail),
        cardImage: normalizeImageValue(tourData.cardImage),
        coverImage: normalizeOptionalImageValue(tourData.coverImage),
        gallery: Array.isArray(tourData.gallery)
          ? tourData.gallery.map(normalizeOptionalImageValue).filter(Boolean)
          : [],
        media: Array.isArray(tourData.media)
          ? tourData.media.map(normalizeOptionalImageValue).filter(Boolean)
          : [],
        pickupLocations: Array.isArray(tourData.pickupLocations) ? tourData.pickupLocations : [],
        // Ensure dates are Date objects
        startDate: tourData.startDate ? new Date(tourData.startDate) : new Date(),
        endDate: tourData.endDate ? new Date(tourData.endDate) : new Date(Date.now() + 24 * 60 * 60 * 1000),
        // Optional fields without tour-like defaults
        duration: optionalText(tourData.duration),
        tourType: optionalText(tourData.tourType),
        reviewText: optionalText(tourData.reviewText),
        currency: tourData.currency ? String(tourData.currency).trim().toUpperCase() : 'CHF',
        minTicketsPerBooking: Number.isInteger(Number(tourData.minTicketsPerBooking)) && Number(tourData.minTicketsPerBooking) > 0
          ? Number(tourData.minTicketsPerBooking)
          : 1,
        maxTotalTickets: optionalNumber(tourData.maxTotalTickets),
        datePrices: normalizeDatePrices(tourData.datePrices),
        metadata: {
          ...(tourData.metadata && typeof tourData.metadata === 'object' ? tourData.metadata : {}),
          ...(tourData.metadata?.datePrices !== undefined
            ? { datePrices: normalizeDatePrices(tourData.metadata.datePrices) }
            : {}),
        },
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
      const existingTour = await Tour.findOne({ 'metadata.staticId': tourId }).lean();
      if (!existingTour) {
        throw new Error('Tour not found');
      }

      const payload = this.normalizeTourUpdatePayload(updateData, tourId);
      if (payload.division) {
        const division = await this.resolveDivision(payload.division);
        if (!division) {
          throw new Error('Division not found. Please create a division first.');
        }
        payload.division = division._id;
      }
      if (payload.metadata !== undefined) {
        payload.metadata = {
          ...(existingTour.metadata || {}),
          ...payload.metadata,
        };
      }

      const tour = await Tour.findByIdAndUpdate(
        existingTour._id,
        { $set: payload },
        { new: true, runValidators: true }
      ).populate('division', 'name description');

      const tourObj = tour.toObject({ virtuals: true });
      if (!tourObj.id && tourObj._id) {
        tourObj.id = tourObj._id.toString();
      }

      clearTourListCache();
      return tourObj;
    }
    
    const existingTour = await Tour.findById(tourId).lean();
    if (!existingTour) {
      throw new Error('Tour not found');
    }

    const payload = this.normalizeTourUpdatePayload(updateData);
    if (payload.division) {
      const division = await this.resolveDivision(payload.division);
      if (!division) {
        throw new Error('Division not found. Please create a division first.');
      }
      payload.division = division._id;
    }
    if (payload.metadata !== undefined) {
      payload.metadata = {
        ...(existingTour.metadata || {}),
        ...payload.metadata,
      };
    }

    const tour = await Tour.findByIdAndUpdate(
      tourId,
      { $set: payload },
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
