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

export const slugifyTourName = (value) => {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/^explore\s+/, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const getPreferredTourSlug = (tour) => {
  const name = String(tour?.name || tour?.title || "").toLowerCase();
  if (name.includes("lucerne") || name.includes("luzern")) return "lucerne-private-tour";
  if (name.includes("interlaken")) return "interlaken-private-tour";
  if (name.includes("zermatt")) return "zermatt-private-tour";
  if (name.includes("4 country") || name.includes("four country")) return "4-country-tours";
  if (name.includes("grindelwald")) return "grindelwald-tours";
  if (name.includes("crash landing")) return "crashlanding-tours";
  if (name.includes("st. gallen") || name.includes("appenzell")) return "from-zurich-private-st-gallen-and-appenzell-day-tour";
  if (name.includes("rhine falls")) return "zurich-to-rhine-falls-unforgettable-private-day-trip";
  if (name.includes("basel") || name.includes("colmar")) return "from-zurich-full-day-private-tour-basel-and-colmar";
  return "";
};

export const getTourSlug = (tour) => {
  if (!tour) return "";
  const explicitSlug = tour.slug || tour.metadata?.slug;
  if (explicitSlug) return slugifyTourName(explicitSlug);

  const preferredSlug = getPreferredTourSlug(tour);
  if (preferredSlug) return preferredSlug;

  const generatedSlug = slugifyTourName(tour.name || tour.title);
  return generatedSlug || slugifyTourName(getTourId(tour));
};

export const getTourSeoPath = (tour) => {
  const slug = getTourSlug(tour);
  return slug ? `/tours/${slug}` : "/tours";
};

export const getTourCheckoutPath = (tour) => {
  const slug = getTourSlug(tour);
  if (!slug) return getTourSeoPath(tour);

  const destination = String(
    tour?.division ||
    tour?.destination ||
    tour?.country ||
    tour?.metadata?.division ||
    "switzerland"
  ).toLowerCase();
  const destinationKey = destination.includes("sri") ? "srilanka" : "switzerland";

  return `/${destinationKey}/${slug}/checkout`;
};

