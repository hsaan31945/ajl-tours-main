/**
 * Shared data mapper for tour data to ensure consistency across all pages
 */
import { getTourId } from './tourId';
import { cleanDisplayName, formatDurationLabel, formatIncludedLabel } from './textFormatting';

export const mapTourResponse = (tour) => {
  if (!tour) return null;
  
  const tourId = getTourId(tour);
  
  return {
    // Basic Info
    id: tourId,
    name: cleanDisplayName(tour.name || tour.title || ''),
    title: cleanDisplayName(tour.title || tour.name || ''),
    description: tour.description || tour.desc || '',
    overview: tour.overview || '',
    bookingSummary: tour.bookingSummary || '',
    
    // Pricing
    price: tour.price || 0,
    discountEnabled: Boolean(tour.discountEnabled),
    discountPrice: tour.discountPrice ??
      tour.discountedPrice ??
      tour.salePrice ??
      tour.metadata?.discountPrice ??
      tour.metadata?.discountedPrice ??
      tour.metadata?.salePrice ??
      tour.metadata?.discount?.price ??
      null,
    groupDiscountEnabled: tour.groupDiscountEnabled === true,
    groupDiscount4: tour.groupDiscount4 ?? null,
    groupDiscount5: tour.groupDiscount5 ?? null,
    groupDiscount6Plus: tour.groupDiscount6Plus ?? null,
    currency: tour.currency || 'CHF',
    
    // Duration & Details
    duration: tour.duration || '',
    type: tour.tourType || tour.type || '',
    tourType: tour.tourType || tour.type || '',
    reviewText: tour.reviewText || '',
    reviews: Array.isArray(tour.reviews) ? tour.reviews : [],
    reviewCount: Number(tour.reviewCount ?? (Array.isArray(tour.reviews) ? tour.reviews.length : 0)) || 0,
    reviewAverage: Number(tour.reviewAverage ?? tour.avgRating ?? tour.rating ?? 0) || 0,
    avgRating: Number(tour.avgRating ?? tour.reviewAverage ?? tour.rating ?? 0) || 0,
    rating: Number(tour.rating ?? tour.reviewAverage ?? tour.avgRating ?? 0) || 0,
    
    // Content Sections
    highlights: Array.isArray(tour.highlights) ? tour.highlights : [],
    included: Array.isArray(tour.included) ? tour.included : [],
    excluded: Array.isArray(tour.excluded) ? tour.excluded : [],
    itinerary: Array.isArray(tour.itinerary) ? tour.itinerary : [],
    
    // Images & Media
    images: Array.isArray(tour.images) ? tour.images : [],
    thumbnail: tour.thumbnail || '',
    cardImage: tour.cardImage || '',
    coverImage: tour.coverImage || '',
    gallery: Array.isArray(tour.gallery) ? tour.gallery : [],
    media: Array.isArray(tour.media) ? tour.media : [],
    
    // Location & Logistics
    startLocation: tour.startLocation || '',
    endLocation: tour.endLocation || '',
    pickupLocations: Array.isArray(tour.pickupLocations) ? tour.pickupLocations : [],
    
    // Date/Time
    startDate: tour.startDate || null,
    endDate: tour.endDate || null,
    
    // Pricing variations
    datePrices: tour.datePrices || {},
    
    // Metadata
    minTicketsPerBooking: tour.minTicketsPerBooking || 1,
    maxTotalTickets: tour.maxTotalTickets || null,
    isActive: tour.isActive !== undefined ? tour.isActive : true,
    
    // Additional fields
    routeDetails: tour.routeDetails || '',
    metadata: tour.metadata || {},
    
    // Fallbacks for missing fields
    division: tour.division || null,
    divisionName: tour.divisionName || null
  };
};

/**
 * Validates tour data to ensure required fields are present
 */
export const validateTourData = (tour) => {
  if (!tour) return false;
  
  // Check required fields
  const requiredFields = ['id', 'name', 'price'];
  const missingFields = requiredFields.filter(field => !tour[field]);
  
  if (missingFields.length > 0) {
    console.warn('Tour data missing required fields:', missingFields);
    return false;
  }
  
  // Validate data types
  const validations = [
    { field: 'price', condition: typeof tour.price === 'number' && !isNaN(tour.price) },
    { field: 'name', condition: typeof tour.name === 'string' && tour.name.trim() !== '' }
  ];
  
  const invalidFields = validations.filter(v => !v.condition).map(v => v.field);
  
  if (invalidFields.length > 0) {
    console.warn('Tour data validation failed for fields:', invalidFields);
    return false;
  }
  
  return true;
};

/**
 * Compares tour data between two sources to ensure consistency
 */
export const compareTourData = (source1, source2, sourceNames = ['Source 1', 'Source 2']) => {
  if (!source1 || !source2) {
    console.warn('Cannot compare tour data: one or both sources are null');
    return false;
  }
  
  const differences = [];
  
  // Compare basic fields
  const fieldsToCompare = [
    'id', 'name', 'title', 'description', 'overview', 
    'price', 'currency', 'duration', 'type', 'reviewText'
  ];
  
  fieldsToCompare.forEach(field => {
    if (source1[field] !== source2[field]) {
      differences.push({
        field,
        [sourceNames[0]]: source1[field],
        [sourceNames[1]]: source2[field]
      });
    }
  });
  
  // Compare array fields
  const arrayFields = ['highlights', 'included', 'excluded', 'itinerary', 'images', 'pickupLocations'];
  arrayFields.forEach(field => {
    const arr1 = Array.isArray(source1[field]) ? source1[field] : [];
    const arr2 = Array.isArray(source2[field]) ? source2[field] : [];
    
    if (arr1.length !== arr2.length) {
      differences.push({
        field,
        [sourceNames[0]]: `${arr1.length} items`,
        [sourceNames[1]]: `${arr2.length} items`,
        note: 'Array length differs'
      });
    } else if (JSON.stringify(arr1) !== JSON.stringify(arr2)) {
      differences.push({
        field,
        [sourceNames[0]]: 'Array content differs',
        [sourceNames[1]]: 'Array content differs'
      });
    }
  });
  
  if (differences.length > 0) {
    console.warn('Tour data inconsistencies found:', differences);
    return false;
  }
  
  return true;
};

/**
 * Normalizes tour data for consistent display
 */
export const normalizeTourData = (tour) => {
  if (!tour) return null;
  
  // Apply mapping and validation
  const mappedTour = mapTourResponse(tour);
  
  // Additional normalization
  return {
    ...mappedTour,
    // Ensure consistent formatting
    name: cleanDisplayName(mappedTour.name),
    title: cleanDisplayName(mappedTour.title),
    price: Number(mappedTour.price) || 0,
    discountEnabled: Boolean(mappedTour.discountEnabled),
    discountPrice: mappedTour.discountPrice === null || mappedTour.discountPrice === undefined
      ? null
      : Number(mappedTour.discountPrice),
    groupDiscountEnabled: mappedTour.groupDiscountEnabled === true,
    groupDiscount4: mappedTour.groupDiscount4 === null || mappedTour.groupDiscount4 === undefined
      ? null
      : Number(mappedTour.groupDiscount4),
    groupDiscount5: mappedTour.groupDiscount5 === null || mappedTour.groupDiscount5 === undefined
      ? null
      : Number(mappedTour.groupDiscount5),
    groupDiscount6Plus: mappedTour.groupDiscount6Plus === null || mappedTour.groupDiscount6Plus === undefined
      ? null
      : Number(mappedTour.groupDiscount6Plus),
    duration: formatDurationLabel(mappedTour.duration),
    type: mappedTour.type?.toString().trim() || '',
    tourType: mappedTour.tourType?.toString().trim() || '',
    reviewText: mappedTour.reviewText?.toString().trim() || '',
    // Ensure arrays are properly formatted
    highlights: Array.isArray(mappedTour.highlights) ? mappedTour.highlights : [],
    included: Array.isArray(mappedTour.included)
      ? mappedTour.included.map(formatIncludedLabel).filter(Boolean)
      : [],
    excluded: Array.isArray(mappedTour.excluded) ? mappedTour.excluded : [],
    itinerary: Array.isArray(mappedTour.itinerary) ? mappedTour.itinerary : [],
    images: Array.isArray(mappedTour.images) ? mappedTour.images : [],
    thumbnail: mappedTour.thumbnail || '',
    cardImage: mappedTour.cardImage || '',
    coverImage: mappedTour.coverImage || '',
    gallery: Array.isArray(mappedTour.gallery) ? mappedTour.gallery : [],
    media: Array.isArray(mappedTour.media) ? mappedTour.media : [],
    pickupLocations: Array.isArray(mappedTour.pickupLocations) ? mappedTour.pickupLocations : [],
  };
};
