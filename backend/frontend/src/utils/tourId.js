/**
 * Tour ID Utilities (Frontend)
 * Standardized ID handling - matches backend utilities
 */

/**
 * Get tour ID from tour object (standardized)
 */
export const getTourId = (tour) => {
  if (!tour) return null;
  
  // Prefer _id (MongoDB ObjectId)
  if (tour._id) {
    return typeof tour._id === 'object' && tour._id.toString 
      ? tour._id.toString() 
      : String(tour._id);
  }
  
  // Fallback to id field
  if (tour.id) {
    return typeof tour.id === 'object' && tour.id.toString 
      ? tour.id.toString() 
      : String(tour.id);
  }
  
  return null;
};

/**
 * Normalize tour ID to string
 */
export const normalizeTourId = (id) => {
  if (!id) return null;
  
  // Handle MongoDB ObjectId
  if (typeof id === 'object' && id.toString) {
    return id.toString();
  }
  
  // Handle string
  return String(id).trim();
};

/**
 * Validate MongoDB ObjectId format
 */
export const isValidObjectId = (id) => {
  if (!id) return false;
  const idString = String(id).trim();
  return /^[0-9a-fA-F]{24}$/.test(idString);
};





