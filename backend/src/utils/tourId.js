/**
 * Tour ID Utilities
 * Standardized ID handling - fixes the 102+ instances of tour.id || tour._id
 */

/**
 * Get tour ID from tour object (standardized)
 * @param {Object} tour - Tour object
 * @returns {string|null} - Tour ID as string or null
 */
const getTourId = (tour) => {
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
 * @param {any} id - Tour ID (can be ObjectId, string, etc.)
 * @returns {string|null} - Normalized ID or null
 */
const normalizeTourId = (id) => {
  if (!id) return null;
  
  // Handle MongoDB ObjectId
  if (typeof id === 'object' && id.toString) {
    return id.toString();
  }
  
  // Handle string
  const idString = String(id).trim();
  
  // Validate MongoDB ObjectId format (24 hex characters)
  if (/^[0-9a-fA-F]{24}$/.test(idString)) {
    return idString;
  }
  
  return idString; // Return even if not valid format (for legacy IDs)
};

/**
 * Validate MongoDB ObjectId format
 * @param {any} id - ID to validate
 * @returns {boolean} - True if valid ObjectId format
 */
const isValidObjectId = (id) => {
  if (!id) return false;
  const idString = String(id).trim();
  return /^[0-9a-fA-F]{24}$/.test(idString);
};

module.exports = {
  getTourId,
  normalizeTourId,
  isValidObjectId
};





