import React, { useState, useEffect } from "react";
import { useAdmin } from "../context/AdminContext";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import EditableText from "../components/EditableText";
import EditableField from "../components/EditableField";
import TourEditWizard from "../components/TourEditWizard";
import AdminModeIndicator from "../components/AdminModeIndicator";
import ApproxPriceNote from "../components/ApproxPriceNote";
import { normalizeTourData } from '../utils/tourDataMapper';
import { normalizeTourId, isValidObjectId, getTourId, getTourSeoPath, matchesTourIdentifier } from '../utils/tourId';
import { apiUrl, getBackendUrl } from '../utils/api';
import { clearToursCache, fetchToursList } from '../services/toursApi';
import { cleanDisplayName, stripHtmlToText } from '../utils/textFormatting';
import ImageCarousel from "../components/ImageCarousel";
import { motion, AnimatePresence } from "framer-motion";
import PaymentSection from "../components/PaymentSection";
import { calculateBookingPricing } from "../utils/bookingPricing";
import TourReviews, { getTourReviewSummary } from "../components/TourReviews";
import { Star } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useI18n } from "../i18n";
import { getTourGalleryImages } from "../utils/tourImages";
import { getMinimumBookingDateString } from "../components/PaymentSection";
import SEO from "../components/SEO";

function ItineraryAccordion({ itinerary = [], adminOn = false, onSave, onAddDraft, fallbackLocation = "" }) {
  const itineraryList = Array.isArray(itinerary) ? itinerary : [];
  const itineraryLength = itineraryList.length;
  const [open, setOpen] = useState(itineraryList.map(() => false));
  const { isAdmin } = useAdmin();
  const { t } = useI18n();
  const effectiveEditMode = adminOn || isAdmin;

  useEffect(() => {
    setOpen((current) => Array.from({ length: itineraryLength }, (_, index) => current[index] || false));
  }, [itineraryLength]);

  const getItemLabel = (item, index) => {
    const type = String(item?.type || "").trim();
    const title = String(item?.title || "").trim();
    const location = String(item?.location || "").trim();
    if (/^arrive back at$/i.test(title || type)) {
      return `Arrive back at ${location || fallbackLocation || "your pickup location"}`;
    }
    return title || location || type || item?.description || `Itinerary item ${index + 1}`;
  };

  const saveItineraryItem = async (index, field, value) => {
    const updated = itineraryList.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    ));
    if (onSave) {
      return await onSave(updated);
    }
    return false;
  };

  const saveActivities = async (index, activities) => {
    const updated = itineraryList.map((item, itemIndex) => (
      itemIndex === index ? { ...item, activities } : item
    ));
    if (onSave) {
      return await onSave(updated);
    }
    return false;
  };

  return (
    <div className="flex flex-col gap-6">
      {itineraryList.map((item, idx) => (
        <div key={idx} className="group">
          <div
            className="flex items-center justify-between bg-gray-100 rounded px-6 py-4 cursor-pointer select-none"
            onClick={() => setOpen((prev) => prev.map((v, i) => (i === idx ? !v : v)))}
          >
            <span className="font-bold text-red-800 flex items-center flex-1">
              <svg className="inline-block mr-2 text-red-600" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21c-4.418 0-8-5.373-8-10a8 8 0 1116 0c0 4.627-3.582 10-8 10z" /><circle cx="12" cy="11" r="3" stroke="currentColor" strokeWidth={2} fill="white" /></svg>
              <EditableField
                value={getItemLabel(item, idx)}
                placeholder="Add itinerary title"
                forceEditMode={effectiveEditMode}
                onSave={async (value) => await saveItineraryItem(idx, 'title', value)}
                className="flex-1"
                tag="span"
                showEditIcon={effectiveEditMode}
              />
            </span>
            <div className="flex items-center gap-2">
              {adminOn && (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const updated = itinerary.filter((_, i) => i !== idx);
                    if (onSave) await onSave(updated);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                  title="Remove item"
                >
                  ✕
                </button>
              )}
            <span className="text-gray-400">{open[idx] ? <>&#9650;</> : <>&#9660;</>}</span>
            </div>
          </div>
          <AnimatePresence initial={false}>
            {open[idx] && (
              <motion.div
                key="content"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-6 py-2 text-gray-700">
                  {(effectiveEditMode || item.description) && (
                    <EditableField
                      value={item.description || ''}
                      placeholder="Add itinerary details"
                      forceEditMode={effectiveEditMode}
                      onSave={async (value) => await saveItineraryItem(idx, 'description', value)}
                      className="block"
                      tag="div"
                      multiline={true}
                    />
                  )}
                  {(effectiveEditMode || item.duration) && (
                    <div className="italic mt-2">
                      <EditableField
                        value={item.duration || ''}
                        placeholder="Add duration"
                        forceEditMode={effectiveEditMode}
                        onSave={async (value) => await saveItineraryItem(idx, 'duration', value)}
                        tag="span"
                        showEditIcon={effectiveEditMode}
                      />
                    </div>
                  )}
                  {(effectiveEditMode || item.location) && (
                    <div className="text-sm text-gray-500 mt-1">
                      <span className="font-medium">{t("booking.location")} </span>
                      <EditableField
                        value={item.location || ''}
                        placeholder="Add location"
                        forceEditMode={effectiveEditMode}
                        onSave={async (value) => await saveItineraryItem(idx, 'location', value)}
                        tag="span"
                        showEditIcon={effectiveEditMode}
                      />
                    </div>
                  )}
                  {(effectiveEditMode || (item.activities && item.activities.length > 0)) && (
                    <div className="mt-2">
                      <div className="font-semibold">{t("booking.activities")}</div>
                      <ul className="list-disc pl-5">
                        {(Array.isArray(item.activities) ? item.activities : []).map((activity, activityIdx) => (
                          <li key={activityIdx} className="group/activity">
                            <EditableField
                              value={activity}
                              placeholder="Add activity"
                              forceEditMode={effectiveEditMode}
                              onSave={async (value) => {
                                const activities = [...(Array.isArray(item.activities) ? item.activities : [])];
                                activities[activityIdx] = value;
                                return await saveActivities(idx, activities);
                              }}
                              tag="span"
                              showEditIcon={effectiveEditMode}
                            />
                            {adminOn && (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const activities = (Array.isArray(item.activities) ? item.activities : []).filter((_, i) => i !== activityIdx);
                                  await saveActivities(idx, activities);
                                }}
                                className="ml-2 text-red-500 hover:text-red-700 opacity-0 group-hover/activity:opacity-100"
                                title="Remove activity"
                              >
                                ✕
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                      {adminOn && (
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            await saveActivities(idx, [...(Array.isArray(item.activities) ? item.activities : []), 'New activity']);
                          }}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                        {t("booking.addActivity")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
      {itineraryLength === 0 && (
      <div className="text-gray-500 italic py-4 text-center">{t("booking.noItinerary")}</div>
      )}
      {adminOn && (
        <button
          type="button"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const newItem = { title: '', description: '', duration: '', location: '', activities: [] };
            if (onAddDraft) onAddDraft(newItem);
            setOpen((current) => [...current, true]);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          + Add Itinerary Item
        </button>
      )}
    </div>
  );
}

function RatingStars({ rating = 0 }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((starValue) => {
        const fillPercent = Math.max(0, Math.min(100, (rating - (starValue - 1)) * 100));

        return (
          <span key={starValue} className="relative inline-flex h-4 w-4">
            <Star className="h-4 w-4 text-gray-300 fill-current" aria-hidden="true" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
              <Star className="h-4 w-4 text-[#102341] fill-current" aria-hidden="true" />
            </span>
          </span>
        );
      })}
    </div>
  );
}

const Checkout = () => {
  const location = useLocation();
  const { id } = useParams();
  const { user } = useContext(AppContext);
  const { isAdmin, passcodeHeader } = useAdmin();
  const { formatPrice } = useCurrency();
  const { t } = useI18n();
  const legacyIsAdmin = user?.isAdmin || false;
  const adminOn = isAdmin || legacyIsAdmin;
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [highlights, setHighlights] = useState([]);
  const [included, setIncluded] = useState([]);
  const [excluded, setExcluded] = useState([]);
  const [itinerary, setItinerary] = useState([]);
  const [error, setError] = useState(null);
  
  // State for booking history
  const [bookingHistory, setBookingHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // State for booking form and calendar
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const minBookingDateStr = getMinimumBookingDateString();
  // Choose next available time slot (9:00 or 10:00)
  let defaultTime = '09:00';
  if (now.getHours() >= 10) defaultTime = '10:00';
  if (now.getHours() >= 11) defaultTime = '09:00'; // fallback to 9:00 if past 10am

  const [selectedDate, setSelectedDate] = useState(minBookingDateStr);
  const [selectedTime, setSelectedTime] = useState(defaultTime);
  const [tickets, setTickets] = useState(1);
  
  // State for Tour Edit Wizard - moved here to ensure consistent hook order
  const [showEditWizard, setShowEditWizard] = useState(false);
  
  const navigate = useNavigate();

  const syncTourState = (tourData) => {
    const normalizedData = normalizeTourData(tourData);
    setTour(normalizedData);
    setHighlights(Array.isArray(normalizedData.highlights) ? [...normalizedData.highlights] : []);
    setIncluded(Array.isArray(normalizedData.included) ? [...normalizedData.included] : []);
    setExcluded(Array.isArray(normalizedData.excluded) ? [...normalizedData.excluded] : []);
    setItinerary(Array.isArray(normalizedData.itinerary) ? normalizedData.itinerary.map((item) => ({ ...item })) : []);
    return normalizedData;
  };

  // Fetch tour from API when id changes
  useEffect(() => {
    // Always fetch when id changes, even if we have state tour
    if (!id) {
      setTour(null);
      setLoading(false);
      return;
    }

    const fetchTour = async () => {
      // Declare variables outside try block to avoid scope issues
      let tourIdString = '';
      let fetchUrl = '';
      let backendUrl = '';
      
      try {
        setLoading(true);
        setTour(null); // Clear previous tour immediately
        
        // Validate ID first
        if (!id) {
          throw new Error('Tour ID is missing from URL');
        }
        
        // Use standardized ID utility. Human-readable slugs are resolved to the
        // backing database ID before requesting the full tour record.
        tourIdString = normalizeTourId(id);
        if (!isValidObjectId(tourIdString)) {
          const stateTour = location.state?.tour || location.state?.tourData;
          const matchedStateTour = matchesTourIdentifier(stateTour, tourIdString) ? stateTour : null;
          const tours = matchedStateTour
            ? []
            : await fetchToursList({ limit: 100 });
          const matchedTour = matchedStateTour || tours.find((item) => matchesTourIdentifier(item, tourIdString));
          const matchedTourId = getTourId(matchedTour);
          if (!matchedTourId) throw new Error("Tour not found");
          tourIdString = normalizeTourId(matchedTourId);
        }
        
        console.log('\n========================================');
        console.log('=== CHECKOUT PAGE - FETCHING TOUR ===');
        console.log('========================================');
        console.log('Tour ID from URL params:', id);
        console.log('Tour ID as string:', tourIdString);
        console.log('Tour ID length:', tourIdString.length);
        console.log('Tour ID is valid format?', isValidObjectId(tourIdString));
        console.log('Fetching from URL:', `/api/tours/${tourIdString}`);
        console.log('========================================');
        console.log('=== END FETCH LOG ===');
        console.log('========================================\n');
        
        backendUrl = getBackendUrl();
        fetchUrl = `${backendUrl}/api/tours/${tourIdString}`;
        
        console.log('Fetching tour from:', fetchUrl);
        const res = await fetch(fetchUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'default',
          credentials: 'include',
          mode: 'cors' // Explicitly set CORS mode
        });
        
        if (res.ok) {
          const data = await res.json();
          console.log('Raw tour data from API:', data);
          const normalizedData = normalizeTourData(data);
          
          // Log for debugging data consistency
          console.log('Checkout - Fetched Tour Data from Database:', {
            id: normalizedData.id,
            name: normalizedData.name,
            price: normalizedData.price,
            duration: normalizedData.duration,
            highlightsCount: normalizedData.highlights?.length || 0,
            highlights: normalizedData.highlights,
            includedCount: normalizedData.included?.length || 0,
            included: normalizedData.included,
            excludedCount: normalizedData.excluded?.length || 0,
            excluded: normalizedData.excluded,
            itineraryCount: normalizedData.itinerary?.length || 0,
            itinerary: normalizedData.itinerary
          });
          
          // Always use database data - do NOT fallback to hardcoded data
          syncTourState(normalizedData);
          setError(null); // Clear any previous errors
          const highlightsArray = Array.isArray(normalizedData.highlights) ? normalizedData.highlights : [];
          const includedArray = Array.isArray(normalizedData.included) ? normalizedData.included : [];
          const excludedArray = Array.isArray(normalizedData.excluded) ? normalizedData.excluded : [];
          const itineraryArray = Array.isArray(normalizedData.itinerary) ? normalizedData.itinerary : [];
          
          console.log('Initialized array states:', {
            highlights: highlightsArray.length,
            included: includedArray.length,
            excluded: excludedArray.length,
            itinerary: itineraryArray.length
          });
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.error('Failed to fetch tour from database:', res.status, errorData);

          let errorMsg = errorData.error || `Tour not found (Status: ${res.status})`;
          
          // Provide more helpful error messages
          if (res.status === 404) {
            errorMsg = `Tour not found in database. The tour with ID "${tourIdString}" does not exist.`;
          } else if (res.status === 400) {
            errorMsg = errorData.details || errorData.error || 'Invalid tour ID format';
          } else if (res.status === 500) {
            errorMsg = 'Server error while fetching tour. Please try again later.';
          }
          
          setError(errorMsg);
          // Don't fallback to hardcoded data - show error or empty state
        }
      } catch (error) {
        console.error('Error fetching tour from database:', error);
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
          tourId: tourIdString || id || 'unknown',
          fetchUrl: fetchUrl || 'unknown',
          backendUrl: backendUrl || 'unknown'
        });
        
        // More detailed error message
        let errorMessage = 'Failed to load tour';
        if (error.message === 'Failed to fetch') {
          errorMessage = 'Failed to fetch tour from server. This might be a CORS or network issue. Please check:\n1. Backend server is running\n2. CORS is configured correctly\n3. Network connection is stable';
        } else {
          errorMessage = `Error loading tour: ${error.message}`;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTour();
  }, [id, location.pathname, location.state]);

  // Load booking history
  useEffect(() => {
    const loadBookingHistory = async () => {
      if (!user?.email) {
        setIsLoadingHistory(false);
        return;
      }
      try {
        const res = await fetch(`${getBackendUrl()}/api/bookings?email=${encodeURIComponent(user.email)}`);
        if (res.ok) {
          const data = await res.json();
          setBookingHistory(Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []));
        }
      } catch (err) {
        console.error('Error loading booking history:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadBookingHistory();
  }, [user?.email]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-700">{t("booking.loadingTourDetails")}</div>
          <div className="text-sm text-gray-500 mt-2">{t("booking.loadingTourText")}</div>
        </div>
      </div>
    );
  }

  // Show error state if tour failed to load and no tour data
  if (!loading && !tour && id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t("booking.failedLoadTour")}</h2>
          <p className="text-gray-600 mb-4">
            We couldn't load the tour details. This might be due to:
          </p>
          <ul className="text-left text-gray-600 mb-6 space-y-2">
            <li>• Network connection issue</li>
            <li>• Tour not found in database</li>
            <li>• Server configuration problem (CORS)</li>
          </ul>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors block w-full"
            >
              {t("booking.retryLoadingTour")}
            </button>
            <button
              onClick={() => window.history.back()}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors block w-full"
            >
              {t("booking.goBackToTours")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show error if no tour and no ID
  if (!tour && !id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t("payment.noTourTitle")}</h2>
          <p className="text-gray-600 mb-4">{t("booking.pleaseSelectTour")}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const tourName = cleanDisplayName(tour?.title || tour?.name || "Tour");
  const checkoutImages = getTourGalleryImages(tour);
  const pricing = calculateBookingPricing({ tour, tickets, selectedDate });
  const pricePerTicket = pricing.baseUnitPrice;
  const totalPrice = pricing.total;
  const bookingSummary = stripHtmlToText(tour?.bookingSummary || '').slice(0, 400);
  const reviewSummary = getTourReviewSummary(tour);
  const reviewLabel = reviewSummary.reviewCount
    ? `${reviewSummary.reviewAverage.toFixed(1)}/5`
    : t("common.noRatingsYet");
  // Only admins can edit - no toggle needed
  const effectiveEditMode = adminOn;

  const buildTourUpdatePayload = (fieldName, value) => {
    const tourId = getTourId(tour);
    const payload = { [fieldName]: value };

    if (!isValidObjectId(tourId)) {
      payload.metadata = {
        ...(tour?.metadata || {}),
        staticId: String(tourId),
      };
    }

    payload[fieldName] = value;
    return payload;
  };
  
  // Simple helper function to save array fields - follows same pattern as description, price, etc.
  const saveArrayField = async (fieldName, arrayData) => {
    const tourId = getTourId(tour);
    if (!tourId) return false;
    const cleanedData = Array.isArray(arrayData)
      ? arrayData
          .map((item) => (typeof item === 'string' ? item.trim() : item))
          .filter((item) => (typeof item === 'string' ? item.length > 0 : Boolean(item)))
      : [];
    try {
      const res = await fetch(`${getBackendUrl()}/api/tours/${tourId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': passcodeHeader || ''
        },
        body: JSON.stringify(buildTourUpdatePayload(fieldName, cleanedData))
      });
      if (res.ok) {
        const response = await res.json();
        // Backend returns { success, tour } - extract the tour object
        const tourData = response.tour || response;
        clearToursCache();
        syncTourState(tourData);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error saving ${fieldName}:`, error);
      return false;
    }
  };

  // Helper function to save single fields (for Duration, Tour Type, Reviews, etc.)
  const saveSingleField = async (fieldName, value) => {
    const tourId = getTourId(tour);
    if (!tourId) return false;
    try {
      const res = await fetch(`${getBackendUrl()}/api/tours/${tourId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': passcodeHeader || ''
        },
        body: JSON.stringify(buildTourUpdatePayload(fieldName, value))
      });
      if (res.ok) {
        const response = await res.json();
        const tourData = response.tour || response;
        clearToursCache();
        syncTourState(tourData);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error saving ${fieldName}:`, error);
      return false;
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-white text-black w-full">
      <SEO
        title={`${tourName} | AJL Tours`}
        description={stripHtmlToText(tour?.description || tour?.overview || `Book ${tourName} with AJL Tours.`).slice(0, 155)}
        image={checkoutImages[0] || "/logoTravel.png"}
        canonicalPath={getTourSeoPath(tour)}
        noIndex
      />
      <AdminModeIndicator />
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6 text-left w-full max-w-6xl mt-6 md:mt-10 px-4">
        <EditableText
          tag="span"
          className="text-2xl sm:text-3xl md:text-4xl font-bold"
          forceEditMode={effectiveEditMode}
          onSave={async (value) => {
            const tourId = getTourId(tour);
            if (!tourId) return false;
            try {
              const res = await fetch(`${getBackendUrl()}/api/tours/${tourId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Admin-Passcode': passcodeHeader || ''
                },
                body: JSON.stringify(buildTourUpdatePayload('name', value.replace('Explore ', '')))
              });
              if (res.ok) {
                const response = await res.json();
                const tourData = response.tour || response;
                clearToursCache();
                syncTourState(tourData);
                return true;
              }
              return false;
            } catch (error) {
              console.error('Error saving tour name:', error);
              return false;
            }
          }}
        >
          {tourName}
        </EditableText>
      </h1>
      {/* Image Carousel */}
      <div className="w-full max-w-6xl px-4 mb-8">
        {loading ? (
          <div className="h-48 md:h-64 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-gray-400">{t("common.loadingImages")}</span>
          </div>
        ) : (
          <ImageCarousel 
            images={checkoutImages} 
            alt={tourName} 
            className="h-64 sm:h-80 md:h-[400px] lg:h-[500px] object-cover rounded-lg" 
            adminOn={effectiveEditMode}
            onSaveImages={async (newImages) => {
              const success = await saveArrayField('images', newImages);
              if (success) {
                // The tour state is already updated in saveArrayField, which will trigger a re-render
                console.log("Images saved successfully!");
              }
              return success;
            }}
          />
        )}
      </div>
      {/* Info Row */}
      {/* Info Row - Responsive Grid */}
      <div className="w-full max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-6 items-start bg-gray-50 rounded-xl shadow p-6 mb-10">
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-500">{t("common.price")}</span>
          {pricing.hasDiscount && (
            <span className="text-sm font-semibold text-gray-400 line-through">
              {formatPrice(pricing.originalBaseUnitPrice)}
            </span>
          )}
          {effectiveEditMode ? (
            <EditableField
              value={`${t("common.from")} ${tour?.currency || "CHF"}${pricing.originalBaseUnitPrice.toFixed(2)}`}
              tag="span"
              className="text-lg font-bold text-red-600"
              forceEditMode={effectiveEditMode}
              onSave={(value) => {
                const priceValue = parseFloat(value.match(/\d+\.?\d*/)?.[0] || tour?.price);
                return saveSingleField('price', priceValue);
              }}
            />
          ) : (
            <span className="text-lg font-bold text-red-600">
              {t("common.from")} {formatPrice(pricePerTicket)}
            </span>
          )}
          <ApproxPriceNote />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-500">{t("common.duration")}</span>
          <EditableField
            value={tour?.duration || t("common.notSpecified")}
            tag="span"
            className="text-lg font-bold"
            forceEditMode={effectiveEditMode}
            onSave={(value) => saveSingleField('duration', value)}
          />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-500">{t("common.tourType")}</span>
          <EditableField
            value={tour?.type || t("common.notSpecified")}
            tag="span"
            className="text-lg font-bold"
            forceEditMode={effectiveEditMode}
            onSave={(value) => saveSingleField('tourType', value)}
          />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-500">{t("common.reviews")}</span>
          <span className="text-lg font-bold">{reviewLabel}</span>
          {reviewSummary.reviewCount > 0 && <RatingStars rating={reviewSummary.reviewAverage} />}
        </div>
      </div>
      {/* Booking History moved to separate page */}

      {/* Two-column layout */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-8 mb-16 px-4">
        {/* Left: Overview/Details */}
        <div className="flex-1 bg-white rounded-xl p-8 shadow">
          <EditableField
            value={t("common.overview")}
            forceEditMode={effectiveEditMode}
            onSave={async () => true}
            className="text-2xl font-bold mb-4 block"
            tag="h2"
          />
          {tour && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <EditableField
                value={tour.title || tour.name || ''}
                forceEditMode={effectiveEditMode}
                onSave={async (value) => {
                  const tourId = getTourId(tour);
                  if (!tourId) return false;
                  try {
                    const res = await fetch(apiUrl(`/api/tours/${tourId}`), {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Passcode': passcodeHeader || ''
                      },
                      body: JSON.stringify(buildTourUpdatePayload('name', value))
                    });
                    if (res.ok) {
                      const response = await res.json();
                      const tourData = response.tour || response;
                      clearToursCache();
                      syncTourState(tourData);
                      return true;
                    }
                    return false;
                  } catch (error) {
                    console.error('Error saving tour name:', error);
                    return false;
                  }
                }}
                className="text-xl font-semibold mb-2 block"
                tag="h3"
              />
              <EditableField
                value={stripHtmlToText(tour.overview || tour.description || '')}
                forceEditMode={effectiveEditMode}
                onSave={async (value) => {
                  const tourId = getTourId(tour);
                  if (!tourId) return false;
                  try {
                    const res = await fetch(apiUrl(`/api/tours/${tourId}`), {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Passcode': passcodeHeader || ''
                      },
                      body: JSON.stringify({
                        ...buildTourUpdatePayload('overview', stripHtmlToText(value)),
                        description: stripHtmlToText(value),
                      })
                    });
                    if (res.ok) {
                      const response = await res.json();
                      const tourData = response.tour || response;
                      clearToursCache();
                      syncTourState(tourData);
                      return true;
                    }
                    return false;
                  } catch (error) {
                    console.error('Error saving overview:', error);
                    return false;
                  }
                }}
                className="text-justify block"
                tag="div"
                multiline={true}
              />
            </div>
          )}
          {/* Highlights Section - Rebuilt from Scratch */}
          <h3 className="text-2xl font-bold mt-8 mb-4">{t("common.highlights")}</h3>
          <ul className="pl-6 space-y-3 text-gray-700 list-none">
            {highlights.map((highlight, index) => (
              <li key={`highlight-${index}`} className="flex items-start group">
                <span className="text-red-600 text-lg align-middle mr-2 mt-1">•</span>
                <EditableField
                  value={typeof highlight === 'string' ? highlight : String(highlight)}
                  forceEditMode={effectiveEditMode}
                  onSave={async (value) => {
                    const updated = [...highlights];
                    updated[index] = value;
                    return await saveArrayField('highlights', updated);
                  }}
                  className="text-justify flex-1"
                  tag="span"
                  multiline={true}
                />
                {adminOn && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const updated = [...highlights];
                          [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
                          await saveArrayField('highlights', updated);
                        }}
                        className="text-blue-500 hover:text-blue-700"
                        title="Move up"
                      >
                        ↑
                      </button>
                    )}
                    {index < highlights.length - 1 && (
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const updated = [...highlights];
                          [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
                          await saveArrayField('highlights', updated);
                        }}
                        className="text-blue-500 hover:text-blue-700"
                        title="Move down"
                      >
                        ↓
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const updated = highlights.filter((_, i) => i !== index);
                        await saveArrayField('highlights', updated);
                      }}
                      className="text-red-500 hover:text-red-700"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </li>
            ))}
            {highlights.length === 0 && (
              <li className="text-gray-500 italic">{t("booking.noHighlights")}</li>
            )}
          </ul>
          {adminOn && (
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                setHighlights((current) => [...current, '']);
              }}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              + Add Highlight
            </button>
          )}
          {/* Included/Excluded Section - Rebuilt from Scratch */}
          <hr className="my-8 border-gray-200" />
          <h2 className="text-2xl font-bold mb-4">{t("common.includedExcluded")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Included Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-700">{t("common.included")}</h3>
            <ul className="space-y-4">
                {included.map((item, index) => (
                  <li key={`included-${index}`} className="flex items-center gap-3 group">
                    <span className="text-green-600 flex-shrink-0">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 10 18 4 12" />
                      </svg>
                  </span>
                    <EditableField
                      value={typeof item === 'string' ? item : String(item)}
                      forceEditMode={effectiveEditMode}
                      onSave={async (value) => {
                        const updated = [...included];
                        updated[index] = value;
                        return await saveArrayField('included', updated);
                      }}
                      className="text-green-700 flex-1"
                      tag="span"
                    />
                    {adminOn && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const updated = [...included];
                              [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
                              await saveArrayField('included', updated);
                            }}
                            className="text-blue-500 hover:text-blue-700"
                            title="Move up"
                          >
                            ↑
                          </button>
                        )}
                        {index < included.length - 1 && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const updated = [...included];
                              [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
                              await saveArrayField('included', updated);
                            }}
                            className="text-blue-500 hover:text-blue-700"
                            title="Move down"
                          >
                            ↓
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const updated = included.filter((_, i) => i !== index);
                            await saveArrayField('included', updated);
                          }}
                          className="text-red-500 hover:text-red-700"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                </li>
              ))}
                {included.length === 0 && (
                <li className="text-gray-500 italic">{t("booking.noIncluded")}</li>
              )}
            </ul>
              {adminOn && (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIncluded((current) => [...current, ""]);
                  }}
                  className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                >
                  + Add Included Item
                </button>
              )}
            </div>
            {/* Excluded Section - Using Atomic API */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-red-700">{t("common.excluded")}</h3>
            <ul className="space-y-4">
                {excluded.map((item, index) => (
                  <li key={`excluded-${index}`} className="flex items-center gap-3 group">
                    <span className="text-red-500 flex-shrink-0">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                  </span>
                    <EditableField
                      value={typeof item === 'string' ? item : String(item)}
                      forceEditMode={effectiveEditMode}
                      onSave={async (value) => {
                        const updated = [...excluded];
                        updated[index] = value;
                        return await saveArrayField('excluded', updated);
                      }}
                      className="text-red-600 flex-1"
                      tag="span"
                    />
                    {adminOn && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const updated = [...excluded];
                              [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
                              await saveArrayField('excluded', updated);
                            }}
                            className="text-blue-500 hover:text-blue-700"
                            title="Move up"
                          >
                            ↑
                          </button>
                        )}
                        {index < excluded.length - 1 && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const updated = [...excluded];
                              [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
                              await saveArrayField('excluded', updated);
                            }}
                            className="text-blue-500 hover:text-blue-700"
                            title="Move down"
                          >
                            ↓
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const updated = excluded.filter((_, i) => i !== index);
                            await saveArrayField('excluded', updated);
                          }}
                          className="text-red-500 hover:text-red-700"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                </li>
              ))}
                {excluded.length === 0 && (
                <li className="text-gray-500 italic">{t("booking.noExcluded")}</li>
              )}
            </ul>
              {adminOn && (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setExcluded((current) => [...current, '']);
                  }}
                  className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                >
                  + Add Excluded Item
                </button>
              )}
            </div>
          </div>

          {/* Itinerary Section - Using Atomic API */}
          <hr className="my-8 border-gray-200" />
          <h2 className="text-3xl font-bold mb-6 text-red-600">{t("common.itinerary")}</h2>
          <ItineraryAccordion 
            itinerary={itinerary} 
            adminOn={adminOn}
            fallbackLocation={tour?.endLocation || tour?.startLocation || tour?.location || ""}
            onSave={async (updatedItinerary) => {
              return await saveArrayField('itinerary', updatedItinerary);
            }}
            onAddDraft={(newItem) => setItinerary((current) => [...current, newItem])}
          />
        </div>
        {/* Right: Book This Tour Box + Related Tours */}
        <div className="w-full md:w-[350px] flex flex-col gap-8 md:sticky md:top-24 h-fit">
          <PaymentSection
            tour={tour}
            tourName={tourName}
            location={tour?.address || tour?.location || ""}
            bookingSummary={bookingSummary}
            price={pricePerTicket}
            tickets={tickets}
            setTickets={setTickets}
            totalPrice={totalPrice}
            currency={pricing.currency}
            date={selectedDate}
            setDate={setSelectedDate}
            minDate={minBookingDateStr}
            time={selectedTime}
            onPriceUpdated={(newPrice) => {
              setTour((currentTour) => ({
                ...currentTour,
                price: newPrice,
              }));
            }}
            onSavePrice={(newPrice) => saveSingleField('price', newPrice)}
            onSaveBookingSummary={(value) => saveSingleField('bookingSummary', stripHtmlToText(value).slice(0, 400))}
            onSaveMinTickets={async (minValue) => {
              const tourId = getTourId(tour);
              if (!tourId) return false;
              try {
                const res = await fetch(`${getBackendUrl()}/api/tours/${tourId}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Passcode': passcodeHeader || ''
                  },
                  body: JSON.stringify(buildTourUpdatePayload('minTicketsPerBooking', Number(minValue)))
                });
                if (res.ok) {
                  const response = await res.json();
                  const tourData = response.tour || response;
                  clearToursCache();
                  syncTourState(tourData);
                  return true;
                }
                return false;
              } catch (error) {
                console.error('Error saving minTickets:', error);
                return false;
              }
            }}
          />
        </div>
      </div>
      <TourReviews
        tour={tour}
        onTourUpdated={(updatedTour) => {
          clearToursCache();
          syncTourState(updatedTour);
        }}
      />
    </div>
  );
};

// Update CalendarPrices to accept selectedDate and setSelectedDate as props
function CalendarPrices({ selectedDate, setSelectedDate, price = 0, currency = "CHF" }) {
  const [month, setMonth] = useState(6); // July (0-indexed)
  const [year, setYear] = useState(2025);
  const [selected, setSelected] = useState(() => {
    if (selectedDate) {
      const d = new Date(selectedDate);
      if (d.getFullYear() === 2025 && d.getMonth() === 6) return d.getDate();
    }
    return null;
  });
  useEffect(() => {
    if (selectedDate) {
      const d = new Date(selectedDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        setSelected(d.getDate());
      } else {
        setSelected(null);
      }
    }
  }, [selectedDate, month, year]);

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const prices = `${currency}${price}`;

  // Get first day of the month (0=Sun, 1=Mon...)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const prevMonthLastDay = new Date(year, month, 0);
  // Adjust for Monday as first day
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const daysInMonth = lastDay.getDate();
  const daysInPrevMonth = prevMonthLastDay.getDate();

  // Build calendar grid
  let calendar = [];
  let dayNum = 1;
  let nextMonthDay = 1;
  for (let week = 0; week < 6; week++) {
    let weekRow = [];
    for (let d = 0; d < 7; d++) {
      let cell = null;
      if (week === 0 && d < startDay) {
        // Previous month
        cell = { day: daysInPrevMonth - startDay + d + 1, prev: true };
      } else if (dayNum > daysInMonth) {
        // Next month
        cell = { day: nextMonthDay++, next: true };
      } else {
        // Current month
        cell = { day: dayNum++, current: true };
      }
      weekRow.push(cell);
    }
    calendar.push(weekRow);
    if (dayNum > daysInMonth && nextMonthDay > 7) break;
  }

  function prevMonth() {
    if (month === 0) {
      setMonth(11); setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
    setSelected(null);
  }
  function nextMonthFn() {
    if (month === 11) {
      setMonth(0); setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
    setSelected(null);
  }

  const today = new Date();

  return (
    <div className="w-full max-w-3xl">
      <div className="grid grid-cols-7 mb-2">
        {daysOfWeek.map((d) => (
          <div key={d} className="text-center py-2 font-semibold bg-gray-100 rounded-t-lg border-r last:border-r-0">{d}</div>
        ))}
      </div>
      <div className="flex">
        <button onClick={prevMonth} className="bg-red-700 text-white px-4 py-2 rounded-l-lg font-bold">&#60;</button>
        <div className="flex-1 bg-red-700 text-white text-center py-2 font-bold">{new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
        <button onClick={nextMonthFn} className="bg-red-700 text-white px-4 py-2 rounded-r-lg font-bold">&#62;</button>
      </div>
      <div className="grid grid-cols-7 border border-gray-200 rounded-b-lg overflow-hidden">
        {calendar.map((week, i) => (
          <React.Fragment key={i}>
            {week.map((cell, j) => {
              const isSelected = cell.current && cell.day === selected;
              // Disable previous dates
              let isDisabled = false;
              if (cell.current) {
                const cellDate = new Date(year, month, cell.day);
                isDisabled = cellDate < today.setHours(0,0,0,0);
              }
              return (
                <div
                  key={j}
                  className={`h-16 flex flex-col items-center justify-center border-r border-b border-gray-200 last:border-r-0 ${cell.current ? (isDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-gray-50') : 'bg-gray-50 text-gray-400'} ${isSelected ? 'bg-blue-900 text-white font-bold' : ''}`}
                  onClick={() => {
                    if (cell.current && !isDisabled) {
                      setSelected(cell.day);
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
                      setSelectedDate(dateStr);
                    }
                  }}
                  style={isDisabled ? { pointerEvents: 'none' } : {}}
                >
                  <span className="text-base">{cell.day}</span>
                  {cell.current && <span className={`text-xs mt-1 font-bold ${isSelected ? 'text-white' : 'text-red-700'}`}>{prices}</span>}
                  {!cell.current && <span className="text-xs mt-1">{cell.prev || cell.next ? '' : ''}</span>}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default Checkout; 
