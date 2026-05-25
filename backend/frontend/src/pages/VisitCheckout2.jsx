import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { useAdmin } from "../context/AdminContext";
import { normalizeTourData } from '../utils/tourDataMapper';
import { getTourId } from '../utils/tourId';
// Import all tour images
import img1 from "../assets/t3.jpg";
import img2 from "../assets/t4.jpg";
import img3 from "../assets/t5.jpg";
import img4 from "../assets/t2.jpg";
import img5 from "../assets/earth.png";
import img6 from "../assets/headerimg.png";
// Import Zurich images
import zurich1 from "../assets/images/Switzerland/Zurich1.avif";
import zurich3 from "../assets/images/Switzerland/Zurich3.avif";
import zurich4 from "../assets/images/Switzerland/Zurich4.avif";
import zurich5 from "../assets/images/Switzerland/Zurich5.avif";
import zurich6 from "../assets/images/Switzerland/Zurich6.avif";
import zurich7 from "../assets/images/Switzerland/Zurich7.avif";
import zurich8 from "../assets/images/Switzerland/Zurich8.avif";
import zurich9 from "../assets/images/Switzerland/Zurich9.avif";
import zurich10 from "../assets/images/Switzerland/Zurich10.avif";
import zurich12 from "../assets/images/Switzerland/Zurich12.avif";
// Import Crash Landing images
import crashLanding1 from "../assets/images/Crash_Landing/Crash_Landing1.avif";
import crashLanding2 from "../assets/images/Crash_Landing/Crash_Landing2.avif";
import crashLanding3 from "../assets/images/Crash_Landing/Crash_Landing3.avif";
import crashLanding4 from "../assets/images/Crash_Landing/Crash_Landing4.avif";
import crashLanding5 from "../assets/images/Crash_Landing/Crash_Landing5.avif";
import crashLanding6 from "../assets/images/Crash_Landing/Crash_Landing6.avif";
import crashLanding7 from "../assets/images/Crash_Landing/Crash_Landing7.avif";
import crashLanding8 from "../assets/images/Crash_Landing/Crash_Landing8.avif";
import crashLanding9 from "../assets/images/Crash_Landing/Crash_Landing9.avif";
import crashLanding10 from "../assets/images/Crash_Landing/Crash_Landing10.avif";
import crashLanding11 from "../assets/images/Crash_Landing/Crash_Landing11.avif";
import crashLanding12 from "../assets/images/Crash_Landing/Crash_Landing12.avif";
// Import Lucerne images
import lucerne1 from "../assets/images/Lucerne/Lucerne1.avif";
import lucerne2 from "../assets/images/Lucerne/Lucerne2.avif";
import lucerne3 from "../assets/images/Lucerne/Lucerne3.avif";
import lucerne4 from "../assets/images/Lucerne/Lucerne4.avif";
import lucerne5 from "../assets/images/Lucerne/Lucerne5.avif";
import lucerne6 from "../assets/images/Lucerne/Lucerne6.avif";
import lucerne7 from "../assets/images/Lucerne/Lucerne7.avif";
// Import Appenzell Day Tour images
import Appenzell1 from "../assets/images/Appenzell_Day_Tour/Appenzell1.avif";
import Appenzell2 from "../assets/images/Appenzell_Day_Tour/Appenzell2.avif";
import Appenzell3 from "../assets/images/Appenzell_Day_Tour/Appenzell3.avif";
import Appenzell4 from "../assets/images/Appenzell_Day_Tour/Appenzell4.avif";
import Appenzell5 from "../assets/images/Appenzell_Day_Tour/Appenzell5.avif";
import Appenzell6 from "../assets/images/Appenzell_Day_Tour/Appenzell6.avif";
// Import Rhine Falls images
import rhine1 from "../assets/images/Zurich_to_Rhine_Falls/Rhine1.avif";
import rhine2 from "../assets/images/Zurich_to_Rhine_Falls/Rhine2.avif";
import rhine3 from "../assets/images/Zurich_to_Rhine_Falls/Rhine3.avif";
import rhine4 from "../assets/images/Zurich_to_Rhine_Falls/Rhine4.avif";
// Import Titlis Engelberg images
import titlis1 from "../assets/images/Titlis_Engelberg/Titlis1.avif";
import titlis2 from "../assets/images/Titlis_Engelberg/Titlis2.avif";
import titlis3 from "../assets/images/Titlis_Engelberg/Titlis3.avif";
import titlis4 from "../assets/images/Titlis_Engelberg/Titlis4.avif";
import titlis5 from "../assets/images/Titlis_Engelberg/Titlis5.avif";
// Import Basel and Colmar images
import basel1 from "../assets/images/Basel_and_Colmar/Basel1.avif";
import basel2 from "../assets/images/Basel_and_Colmar/Basel2.avif";
import basel3 from "../assets/images/Basel_and_Colmar/Basel3.avif";
import basel4 from "../assets/images/Basel_and_Colmar/Basel4.avif";
// Import Interlaken and Grindelwald images
import interlaken1 from "../assets/images/Interlaken_and_Grindelwald/Interlaken1.avif";
import interlaken2 from "../assets/images/Interlaken_and_Grindelwald/Interlaken2.avif";
import interlaken3 from "../assets/images/Interlaken_and_Grindelwald/Interlaken3.avif";
import interlaken4 from "../assets/images/Interlaken_and_Grindelwald/Interlaken4.avif";
import interlaken5 from "../assets/images/Interlaken_and_Grindelwald/Interlaken5.avif";
import interlaken6 from "../assets/images/Interlaken_and_Grindelwald/Interlaken6.avif";
import { FaRegClock, FaUserFriends, FaCheckCircle, FaUser, FaGlobe, FaCar, FaStar, FaCalendar, FaUsers } from "react-icons/fa";
import EditableText from "../components/EditableText";
import EditableField from "../components/EditableField";
import TourEditWizard from "../components/TourEditWizard";
import AdminModeIndicator from "../components/AdminModeIndicator";
import { tourDescriptions } from "../data/tourDescriptions";

// Default images fallback
const defaultImages = [img1, img2, img3, img4, img5, img6];

// Function to get tour-specific images
const getTourImages = (tour) => {
  if (!tour) return defaultImages;
  
  const tourName = tour.name || tour.title || "";
  // Note: Hardcoded IDs removed - using tour name matching only
  // Legacy ID checks removed for consistency
  
  // Switzerland Tours
  if (tourName.includes("4 Country Tours")) {
    return [zurich1, zurich3, zurich4, zurich5, zurich6, zurich7, zurich8, zurich9, zurich10, zurich12];
  }
  // Removed hardcoded string IDs - using tour name matching only for consistency
  if (tourName.includes("Grindelwald")) {
    return [interlaken1, interlaken2, interlaken3, interlaken4, interlaken5, interlaken6];
  }
  if (tourName.includes("Crashlanding") || tourName.includes("Crash Landing")) {
    return [crashLanding1, crashLanding2, crashLanding3, crashLanding4, crashLanding5, crashLanding6, crashLanding7, crashLanding8, crashLanding9, crashLanding10, crashLanding11, crashLanding12];
  }
  if (tourName.includes("Lauterbrunnen")) {
    return [interlaken1, interlaken2, interlaken3, interlaken4, interlaken5, interlaken6];
  }
  if (tourName.includes("Liechtenstein")) {
    return [zurich1, zurich3, zurich4, zurich5, zurich6, zurich7, zurich8, zurich9, zurich10, zurich12];
  }
  if (tourName.includes("Rhine Falls") && tourName.includes("Black Forest")) {
    return [lucerne1, lucerne2, lucerne3, lucerne4, lucerne5, lucerne6, lucerne7];
  }
  if (tourName.includes("Appenzell")) {
    return [Appenzell1, Appenzell2, Appenzell3, Appenzell4, Appenzell5, Appenzell6];
  }
  if (tourName.includes("Rhine Falls") && !tourName.includes("Black Forest")) {
    return [rhine1, rhine2, rhine3, rhine4];
  }
  if (tourName.includes("Titlis")) {
    return [titlis1, titlis2, titlis3, titlis4, titlis5];
  }
  if (tourName.includes("Basel")) {
    return [basel1, basel2, basel3, basel4];
  }
  if (tourName.includes("Interlaken") && tourName.includes("Grindelwald")) {
    return [interlaken1, interlaken2, interlaken3, interlaken4, interlaken5, interlaken6];
  }
  
  return defaultImages;
};

const defaultActivity = [
  { icon: <FaCheckCircle className="text-black mr-4" size={28} />, title: "Free cancellation", desc: "Cancel up to 24 hours in advance for a full refund" },
  { icon: <FaUser className="text-black mr-4" size={28} />, title: "Reserve now & pay later", desc: "Keep your travel plans flexible — book your spot and pay nothing today." },
  { icon: <FaRegClock className="text-black mr-4" size={28} />, title: "Duration 10.5 hours", desc: "Check availability to see starting times" },
  { icon: <FaGlobe className="text-black mr-4" size={28} />, title: "Live tour guide", desc: "German, English" },
  { icon: <FaCar className="text-black mr-4" size={28} />, title: "Pickup included", desc: "Complimentary hotel pickup and drop-off service" },
  { icon: <FaUserFriends className="text-black mr-4" size={28} />, title: "Private group", desc: "Exclusive private tour experience for your group" }
];

// Sample reviews data
const reviews = [
  {
    id: 1,
    name: "Marilyn",
    country: "United States",
    date: "August 7, 2025",
    rating: 5,
    verified: true,
    text: "We had a great time. We had hoped to visit Germany while we were in Switzerland and this fulfilled our hopes and much more. Our guide was informative and answered our questions...",
    avatar: "M"
  },
  {
    id: 2,
    name: "Gurdeep",
    country: "United Kingdom", 
    date: "July 23, 2025",
    rating: 5,
    verified: true,
    text: "We really enjoyed our day tour with Mr Shabbir. We were picked up directly from our hotel in a spacious and air conditioned car. The day was well paced and went smoothly...",
    avatar: "G"
  }
];

// Tour-specific descriptions
const getTourDescription = (tour) => {
  if (!tour) return "Discover amazing destinations with our expert guides and create unforgettable memories.";
  
  const tourName = tour.name || tour.title || "";
  // Removed hardcoded tourId - using tour name matching only for consistency
  
  // Use the database overview content
  return tour?.overview || tourData?.overview || "Discover amazing destinations with our expert guides and create unforgettable memories. Experience the best of local culture, stunning landscapes, and authentic adventures tailored to your interests. Each tour is carefully crafted to showcase the unique character and highlights of the region you're exploring.";
};

export default function VisitCheckout2() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [participants, setParticipants] = useState(1);
  const [customPrice, setCustomPrice] = useState("");
  const [showPriceInput, setShowPriceInput] = useState(false);
  const location = useLocation();
  const { isAdmin: legacyIsAdmin } = useContext(AppContext);
  const { isAdmin, passcodeHeader } = useAdmin();
  const adminOn = isAdmin || legacyIsAdmin;
  const tour = location.state?.tour;
  const [remainingInfo, setRemainingInfo] = useState({ maxTotal: null, alreadyBooked: 0, remaining: null });
  const [tourData, setTourData] = useState(tour);
  const [itinerary, setItinerary] = useState(tour?.itinerary || []);
  const [datePrices, setDatePrices] = useState(tour?.datePrices || {});
  const [highlights, setHighlights] = useState(tourData?.highlights || []);
  const [included, setIncluded] = useState(tourData?.included || []);
  const [excluded, setExcluded] = useState(tourData?.excluded || []);
  
  // Only admins can edit - no toggle needed
  const effectiveEditMode = adminOn;
  
  // State for Tour Edit Wizard
  const [showEditWizard, setShowEditWizard] = useState(false);
  const [pickupLocations, setPickupLocations] = useState(tourData?.pickupLocations || []);
  const [overview, setOverview] = useState(tourData?.overview || "");

  // Fetch full tour data including itinerary and datePrices
  useEffect(() => {
    const fetchTourData = async () => {
      if (!tour?.id) return;
      try {
        const res = await fetch(`/api/tours/${tour.id}`);
        if (res.ok) {
          const data = await res.json();
          const normalizedData = normalizeTourData(data);
          
          // Log for debugging data consistency
          console.log('VisitCheckout2 - Fetched Tour Data:', {
            id: normalizedData.id,
            name: normalizedData.name,
            price: normalizedData.price,
            duration: normalizedData.duration,
            highlightsCount: normalizedData.highlights?.length || 0,
            includedCount: normalizedData.included?.length || 0,
            excludedCount: normalizedData.excluded?.length || 0,
            itineraryCount: normalizedData.itinerary?.length || 0
          });
          
          setTourData(normalizedData);
          setItinerary(normalizedData.itinerary || []);
          setDatePrices(normalizedData.datePrices || {});
          setHighlights(normalizedData.highlights || []);
          setIncluded(normalizedData.included || []);
          setExcluded(normalizedData.excluded || []);
          setPickupLocations(normalizedData.pickupLocations || []);
          setOverview(normalizedData.overview || "");
        }
      } catch (error) {
        console.error('Error fetching tour data:', error);
      }
    };
    fetchTourData();
  }, [tour?.id]);

  // Save itinerary to database (using main API endpoint for consistency)
  const saveItinerary = async (newItinerary) => {
    return await saveArrayField('itinerary', newItinerary);
  };

  // Save date price to database
  const saveDatePrice = async (date, price) => {
    if (!tour?.id) return false;
    try {
      const res = await fetch(`/api/tours/${tour.id}/date-price`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': passcodeHeader || ''
        },
        body: JSON.stringify({ date, price: Number(price) })
      });
      if (res.ok) {
        const updatedPrices = { ...datePrices, [date]: Number(price) };
        setDatePrices(updatedPrices);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving date price:', error);
      return false;
    }
  };

  // Save tour description
  const saveDescription = async (description) => {
    if (!tour?.id) return false;
    try {
      const res = await fetch(`/api/tours/${tour.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': passcodeHeader || ''
        },
        body: JSON.stringify({ ...tourData, description })
      });
      if (res.ok) {
        setTourData(prev => ({ ...prev, description }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving description:', error);
      return false;
    }
  };

  // Save base tour price
  const saveBasePrice = async (price) => {
    if (!tour?.id) return false;
    try {
      const priceNum = Number(price);
      if (isNaN(priceNum) || priceNum < 0) return false;
      const res = await fetch(`/api/tours/${tour.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': passcodeHeader || ''
        },
        body: JSON.stringify({ ...tourData, price: priceNum })
      });
      if (res.ok) {
        setTourData(prev => ({ ...prev, price: priceNum }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving price:', error);
      return false;
    }
  };

  // Load/save checkout settings (per tour)
  const [settings, setSettings] = useState({});
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/content/homepage/checkout_settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data?.content || {});
        }
      } catch (e) {}
    })();
  }, []);
  const saveSettings = async (updated) => {
    try {
      const res = await fetch('/api/admin/content/checkout_settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Passcode': passcodeHeader || '' },
        body: JSON.stringify({ content: updated })
      });
      if (!res.ok) return false;
      setSettings(updated);
      return true;
    } catch { return false; }
  };

  const tourKey = tour?.id || 'unknown';
  const tourSettings = settings[tourKey] || {};
  const activityOverrides = Array.isArray(tourSettings.activity) ? tourSettings.activity : [];
  const minTickets = Number.isFinite(tourSettings.minTickets) ? tourSettings.minTickets : 1;
  const maxTotal = Number.isFinite(tourSettings.maxTotal) ? tourSettings.maxTotal : null;

  const effectiveActivity = (defaultActivity).map((item, idx) => {
    const ov = activityOverrides[idx];
    return ov ? { ...item, title: ov.title ?? item.title, desc: ov.desc ?? item.desc } : item;
  });

  const updateActivityItem = async (idx, next) => {
    const arr = [...activityOverrides];
    arr[idx] = { ...(arr[idx] || {}), ...next };
    const updated = { ...settings, [tourKey]: { ...(settings[tourKey] || {}), activity: arr } };
    return await saveSettings(updated);
  };
  const addActivityItem = async () => {
    const arr = [...activityOverrides, { title: 'New item', desc: '' }];
    const updated = { ...settings, [tourKey]: { ...(settings[tourKey] || {}), activity: arr } };
    return await saveSettings(updated);
  };
  const removeActivityItem = async (idx) => {
    const arr = activityOverrides.filter((_, i) => i !== idx);
    const updated = { ...settings, [tourKey]: { ...(settings[tourKey] || {}), activity: arr } };
    return await saveSettings(updated);
  };
  const moveActivityItem = async (idx, dir) => {
    const t = idx + dir; if (t < 0 || t >= activityOverrides.length) return false;
    const arr = [...activityOverrides]; [arr[idx], arr[t]] = [arr[t], arr[idx]];
    const updated = { ...settings, [tourKey]: { ...(settings[tourKey] || {}), activity: arr } };
    return await saveSettings(updated);
  };

  // Helper function to save array field to database
  const saveArrayField = async (fieldName, arrayData) => {
    if (!tour?.id) return false;
    try {
      const res = await fetch(`/api/tours/${tour.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': passcodeHeader || ''
        },
        body: JSON.stringify({ ...tourData, [fieldName]: arrayData })
      });
      if (res.ok) {
        const savedTour = await res.json();
        setTourData(prev => ({ ...prev, [fieldName]: arrayData }));
        // Update specific state
        if (fieldName === 'highlights') setHighlights(arrayData);
        else if (fieldName === 'included') setIncluded(arrayData);
        else if (fieldName === 'excluded') setExcluded(arrayData);
        else if (fieldName === 'itinerary') setItinerary(arrayData);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error saving ${fieldName}:`, error);
      return false;
    }
  };

  // Move highlight up/down
  const moveHighlight = async (idx, dir) => {
    if (idx + dir < 0 || idx + dir >= highlights.length) return;
    const arr = [...highlights];
    [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
    await saveArrayField('highlights', arr);
  };

  // Move included item up/down
  const moveIncluded = async (idx, dir) => {
    if (idx + dir < 0 || idx + dir >= included.length) return;
    const arr = [...included];
    [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
    await saveArrayField('included', arr);
  };

  // Move excluded item up/down
  const moveExcluded = async (idx, dir) => {
    if (idx + dir < 0 || idx + dir >= excluded.length) return;
    const arr = [...excluded];
    [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
    await saveArrayField('excluded', arr);
  };

  // Move itinerary item up/down
  const moveItineraryItem = async (idx, dir) => {
    if (idx + dir < 0 || idx + dir >= itinerary.length) return;
    const arr = [...itinerary];
    [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
    await saveArrayField('itinerary', arr);
  };

  // Enforce min tickets on client
  useEffect(() => {
    if (participants < minTickets) setParticipants(minTickets);
  }, [minTickets]);

  // Debug participants state changes
  useEffect(() => {
    console.log('Participants state changed to:', participants);
  }, [participants]);

  // Get tour-specific images - prioritize database images, fallback to hardcoded
  const getImagesForTour = (tour) => {
    // First, check if tour has images from database
    if (tour?.images && Array.isArray(tour.images) && tour.images.length > 0) {
      // Handle both base64 data URLs and file paths
      return tour.images.map(img => {
        // If it's already a data URL (base64), use it directly
        if (typeof img === 'string' && (img.startsWith('data:') || img.startsWith('http://') || img.startsWith('https://'))) {
          return img;
        }
        // If it's a relative path, try to resolve it
        if (typeof img === 'string' && img.startsWith('/')) {
          return img;
        }
        // If it's a relative path without leading slash, add it
        if (typeof img === 'string') {
          return img.startsWith('/') ? img : '/' + img;
        }
        return img;
      });
    }
    // Fallback to hardcoded images
    return getTourImages(tour);
  };
  
  const tourImages = getImagesForTour(tour);
  const heroImages = tourImages.slice(0, 4);
  const extraImages = tourImages.slice(4);

  const tourTitle = tourData?.name || tour?.name || tour?.title || "Zurich: Private Liechtenstein, Austria, and Germany Day Trip";
  const baseTourPrice = tourData?.price || tour?.price || 279;
  // Get price for selected date, or use base price
  const tourPrice = selectedDate && datePrices[selectedDate] ? datePrices[selectedDate] : baseTourPrice;
  const tourDescription = tourData?.description || getTourDescription(tour);
  const tourCurrency = tourData?.currency || tour?.currency || "CHF";

  // Get today's date
  const today = new Date().toISOString().split('T')[0];

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    if (adminOn) setShowPriceInput(true);
  };

  const handleCustomPriceChange = (e) => setCustomPrice(e.target.value);

  // Load date price when date is selected
  useEffect(() => {
    if (selectedDate && datePrices[selectedDate]) {
      setCustomPrice(datePrices[selectedDate].toString());
    } else {
      setCustomPrice('');
    }
  }, [selectedDate, datePrices]);

  // Fetch availability when date changes
  useEffect(() => {
    (async () => {
      if (!selectedDate || !tour) { setRemainingInfo({ maxTotal: null, alreadyBooked: 0, remaining: null }); return; }
      try {
        const qs = new URLSearchParams({ tourId: tour?.id || 'unknown', tourTitle: tourTitle, date: selectedDate }).toString();
        const res = await fetch(`/api/availability?${qs}`);
        if (res.ok) {
          const data = await res.json();
          setRemainingInfo(data);
        }
      } catch {}
    })();
  }, [selectedDate, tourTitle, tour?.id]);

  const basePrice = customPrice ? parseFloat(customPrice) : tourPrice;
  const totalPrice = basePrice * participants;

  return (
    <div>
      <AdminModeIndicator />
      {/* Title and Info */}
      <div className="px-6 pt-10 pb-4 w-full">
        <EditableField
          value={tourTitle}
          forceEditMode={effectiveEditMode}
          onSave={async (value) => {
            if (!tour?.id) return false;
            try {
              const res = await fetch(`/api/tours/${tour.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Admin-Passcode': passcodeHeader || ''
                },
                body: JSON.stringify({ ...tourData, name: value })
              });
              if (res.ok) {
                setTourData(prev => ({ ...prev, name: value }));
                return true;
              }
              return false;
            } catch (error) {
              console.error('Error saving title:', error);
              return false;
            }
          }}
          className="text-3xl font-bold mb-2 block"
          tag="h1"
          placeholder="Tour title..."
        />
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <EditableField
            value="Top rated"
            forceEditMode={effectiveEditMode}
            onSave={async () => true}
            className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded"
            tag="span"
          />
          <EditableField
            value="★ 4.9"
            forceEditMode={effectiveEditMode}
            onSave={async () => true}
            className="text-lg font-bold text-orange-600"
            tag="span"
          />
          <EditableField
            value="23 reviews"
            forceEditMode={effectiveEditMode}
            onSave={async () => true}
            className="text-orange-700"
            tag="span"
          />
          <EditableField
            value="• Activity provider: AJL Tours"
            forceEditMode={effectiveEditMode}
            onSave={async () => true}
            className="text-gray-500"
            tag="span"
          />
        </div>
      </div>

      {/* Summary Info Row - Duration, Tour Type, Reviews */}
      <div className="w-full flex flex-wrap justify-between items-center bg-gray-50 rounded-xl shadow p-6 mb-6 mx-6 gap-6">
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-500">Price</span>
          <EditableField
            value={`${tourCurrency}${baseTourPrice}`}
            forceEditMode={effectiveEditMode}
            onSave={async (value) => {
              const priceMatch = value.match(/[\d.]+/);
              if (priceMatch) {
                return await saveBasePrice(priceMatch[0]);
              }
              return false;
            }}
            className="text-lg font-bold text-red-600"
            tag="span"
          />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-500">Duration</span>
          <EditableField
            value={tourData?.duration || "12 hours"}
            forceEditMode={effectiveEditMode}
            onSave={async (value) => {
              if (!tour?.id) return false;
              try {
                const res = await fetch(`/api/tours/${tour.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Passcode': passcodeHeader || ''
                  },
                  body: JSON.stringify({ ...tourData, duration: value })
                });
                if (res.ok) {
                  setTourData(prev => ({ ...prev, duration: value }));
                  return true;
                }
                return false;
              } catch (error) {
                console.error('Error saving duration:', error);
                return false;
              }
            }}
            className="text-lg font-bold"
            tag="span"
          />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-500">Tour Type</span>
          <EditableField
            value={tourData?.tourType || "Day Tour, Private Tour"}
            forceEditMode={effectiveEditMode}
            onSave={async (value) => {
              if (!tour?.id) return false;
              try {
                const res = await fetch(`/api/tours/${tour.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Passcode': passcodeHeader || ''
                  },
                  body: JSON.stringify({ ...tourData, tourType: value })
                });
                if (res.ok) {
                  setTourData(prev => ({ ...prev, tourType: value }));
                  return true;
                }
                return false;
              } catch (error) {
                console.error('Error saving tour type:', error);
                return false;
              }
            }}
            className="text-lg font-bold"
            tag="span"
          />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-500">Reviews</span>
          <EditableField
            value={tourData?.reviewText || "No reviews yet"}
            forceEditMode={effectiveEditMode}
            onSave={async (value) => {
              if (!tour?.id) return false;
              try {
                const res = await fetch(`/api/tours/${tour.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Passcode': passcodeHeader || ''
                  },
                  body: JSON.stringify({ ...tourData, reviewText: value })
                });
                if (res.ok) {
                  setTourData(prev => ({ ...prev, reviewText: value }));
                  return true;
                }
                return false;
              } catch (error) {
                console.error('Error saving review text:', error);
                return false;
              }
            }}
            className="text-lg font-bold"
            tag="span"
          />
        </div>
      </div>

      {/* Current Booking Section */}
      <div className="w-full px-6 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <EditableField
            value="Current Booking"
            forceEditMode={effectiveEditMode}
            onSave={async () => true}
            className="text-2xl font-bold mb-4 text-blue-800 block"
            tag="h2"
          />
          <div className="flex items-center justify-between">
            <div>
              <EditableField
                value={tourTitle}
                forceEditMode={effectiveEditMode}
                onSave={async (value) => {
                  if (!tour?.id) return false;
                  try {
                    const res = await fetch(`/api/tours/${tour.id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Passcode': passcodeHeader || ''
                      },
                      body: JSON.stringify({ ...tourData, name: value })
                    });
                    if (res.ok) {
                      setTourData(prev => ({ ...prev, name: value }));
                      return true;
                    }
                    return false;
                  } catch (error) {
                    console.error('Error saving title:', error);
                    return false;
                  }
                }}
                className="font-semibold text-lg text-blue-800 block"
                tag="h3"
              />
              <EditableField
                value="Select your date and time below to continue"
                forceEditMode={effectiveEditMode}
                onSave={async () => true}
                className="text-blue-600 block"
                tag="p"
              />
            </div>
            <div className="text-right">
              <EditableField
                value="Total Price"
                forceEditMode={effectiveEditMode}
                onSave={async () => true}
                className="text-sm text-blue-600 block"
                tag="div"
              />
              <EditableField
                value={`${tourCurrency}${baseTourPrice}`}
                onSave={async (value) => {
                  const priceMatch = value.match(/[\d.]+/);
                  if (priceMatch) {
                    return await saveBasePrice(priceMatch[0]);
                  }
                  return false;
                }}
                className="text-2xl font-bold text-blue-800 block"
                tag="div"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="w-full grid grid-cols-4 grid-rows-2 gap-2 h-80 px-6">
        {/* Large main image */}
        <div className="col-span-2 row-span-2 cursor-pointer relative group" onClick={() => {
          setCurrentImageIndex(0);
          setShowModal(true);
        }}>
          {heroImages[0] ? (
            <img src={heroImages[0]} alt="Main" className="rounded-xl w-full h-full object-cover" onError={(e) => {
              e.target.src = '/placeholder-tour.jpg';
              e.target.onerror = null;
            }} />
          ) : (
            <div className="rounded-xl w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-xl flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/80 text-black px-3 py-1 rounded-full text-sm font-medium">
              View All Photos
            </div>
          </div>
        </div>
        {/* Top right images */}
        <div className="col-span-1 row-span-1 cursor-pointer relative group" onClick={() => {
          setCurrentImageIndex(1);
          setShowModal(true);
        }}>
          {heroImages[1] ? (
            <img src={heroImages[1]} alt="Small1" className="rounded-xl w-full h-full object-cover" onError={(e) => {
              e.target.src = '/placeholder-tour.jpg';
              e.target.onerror = null;
            }} />
          ) : (
            <div className="rounded-xl w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-xs">No image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-xl flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/80 text-black px-2 py-1 rounded-full text-xs font-medium">
              View All
            </div>
          </div>
        </div>
        <div className="col-span-1 row-span-1 cursor-pointer relative group" onClick={() => {
          setCurrentImageIndex(2);
          setShowModal(true);
        }}>
          {heroImages[2] ? (
            <img src={heroImages[2]} alt="Small2" className="rounded-xl w-full h-full object-cover" onError={(e) => {
              e.target.src = '/placeholder-tour.jpg';
              e.target.onerror = null;
            }} />
          ) : (
            <div className="rounded-xl w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-xs">No image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-xl flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/80 text-black px-2 py-1 rounded-full text-xs font-medium">
              View All
            </div>
          </div>
        </div>
        {/* Bottom right with overlay */}
        <div className="col-span-2 row-span-1 relative cursor-pointer" onClick={() => {
          setCurrentImageIndex(0);
          setShowModal(true);
        }}>
          {heroImages[3] ? (
            <img src={heroImages[3]} alt="Small3" className="rounded-xl w-full h-full object-cover" onError={(e) => {
              e.target.src = '/placeholder-tour.jpg';
              e.target.onerror = null;
            }} />
          ) : (
            <div className="rounded-xl w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-xs">No image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
            <span className="text-white text-lg font-bold">+{extraImages.length}</span>
          </div>
        </div>
      </div>
      {/* Full-screen Image Carousel Modal with 25% margins */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowModal(false);
            if (e.key === 'ArrowLeft') setCurrentImageIndex(prev => prev === 0 ? tourImages.length - 1 : prev - 1);
            if (e.key === 'ArrowRight') setCurrentImageIndex(prev => prev === tourImages.length - 1 ? 0 : prev + 1);
          }}
          tabIndex={0}
        >
          {/* Close Button - Top Left with white background */}
          <button
            className="absolute top-[5%] left-[5%] text-black text-3xl font-bold z-10 hover:bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 bg-white shadow-lg"
            onClick={() => setShowModal(false)}
          >
            ×
          </button>
          
                        {/* Image Counter - Top Center */}
              <div className="absolute top-[5%] left-1/2 transform -translate-x-1/2 bg-white text-orange-500 px-4 py-2 rounded-full text-sm font-medium z-10 border border-orange-500">
                {currentImageIndex + 1} / {tourImages.length}
              </div>
          
          {/* Main Carousel Container - Centered with 15% left/right and 10% top/bottom margins */}
          <div className="relative w-[92vw] h-[60vh] sm:w-[60%] sm:h-[65%] flex items-center justify-center">
            {/* Large Central Image */}
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl">
              <div className="flex transition-transform duration-300 ease-in-out w-full h-full" style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
                {tourImages.map((img, idx) => (
                  <div key={idx} className="w-full h-full flex-shrink-0 flex items-center justify-center">
                    <img src={img} alt={`Tour ${idx + 1}`} className="w-full h-full object-cover rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Navigation Arrows - Positioned further to the edges */}
            <button
              onClick={() => setCurrentImageIndex(prev => prev === 0 ? tourImages.length - 1 : prev - 1)}
              className="absolute left-3 sm:-left-40 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-black rounded-full w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 z-10"
              aria-label="Previous image"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentImageIndex(prev => prev === tourImages.length - 1 ? 0 : prev + 1)}
              className="absolute right-3 sm:-right-40 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-black rounded-full w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 z-10"
              aria-label="Next image"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* Check Availability Button - Bottom Center */}
            <button
              onClick={() => {
                setShowModal(false);
                if (!selectedDate) {
                  // Scroll to date selection section and show alert
                  document.getElementById('date-selection-section')?.scrollIntoView({ behavior: 'smooth' });
                  alert('Please select a date before proceeding to check availability.');
                  return;
                }
                
                // Store tour data in localStorage for the complete booking flow
                const tourData = {
                  tourName: tourTitle, // Use the actual tour title from the page
                  tourPrice: tourPrice || 0,
                  tourCurrency: tourCurrency || "$",
                  tourId: location.state?.tour?.id || "unknown",
                  selectedDate: selectedDate,
                  tickets: participants, // Use actual participants count
                  tourDescription: tourDescription || "Tour description"
                };
                
                localStorage.setItem('currentTourData', JSON.stringify(tourData));
                console.log('Tour data stored:', tourData);
                console.log('Tour object from location.state:', location.state?.tour);
                console.log('TourTitle being used:', tourTitle);
                console.log('TourPrice being used:', tourPrice);
                
                navigate('/flexibility', { state: { tour: location.state?.tour } });
              }}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full text-sm font-medium z-10 transition-all duration-200 hover:scale-105 shadow-lg"
            >
              Check availability
            </button>
          </div>
        </div>
      )}

      {/* About this activity section */}
      <div className="flex flex-col md:flex-row justify-between items-start w-full px-6 mt-12">
        {/* Left: About this activity */}
        <div className="flex-1">
          <EditableField
            value={tourDescription}
            forceEditMode={effectiveEditMode}
            onSave={saveDescription}
            className="mb-8 text-lg font-medium text-gray-700 leading-relaxed block"
            tag="div"
            multiline={true}
            placeholder="Tour description..."
          />
          
          {/* Enhanced About this activity section */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 shadow-lg border border-orange-100">
            <EditableField
              value="About this activity"
              forceEditMode={effectiveEditMode}
              onSave={async () => true}
              className="text-xl font-bold mb-6 text-gray-800 flex items-center"
              tag="h2"
            >
              <span className="w-2 h-6 bg-gradient-to-b from-orange-500 to-red-600 rounded-full mr-3"></span>
              About this activity
            </EditableField>
            
            <div className="grid gap-4">
              {(activityOverrides.length ? activityOverrides : defaultActivity).map((f, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-start gap-3">
                    {/* Enhanced icon with background */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                        {React.cloneElement(defaultActivity[idx]?.icon || <FaCheckCircle />, { 
                          className: "text-white", 
                          size: 16 
                        })}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <EditableText
                        tag="div"
                        className="font-bold text-base mb-1 text-gray-800 group-hover:text-orange-600 transition-colors pr-4"
                        forceEditMode={effectiveEditMode}
                        onSave={async (txt) => updateActivityItem(idx, { title: txt })}
                      >
                        {f.title}
                      </EditableText>
                      <EditableText
                        tag="div"
                        className="text-gray-600 text-sm leading-relaxed pl-4"
                        forceEditMode={effectiveEditMode}
                        onSave={async (txt) => updateActivityItem(idx, { desc: txt })}
                        multiline={true}
                      >
                        {f.desc || ""}
                      </EditableText>
                    </div>
                    
                    {/* Admin controls with better styling */}
                    {adminOn && (
                      <div className="flex flex-col gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => moveActivityItem(idx, -1)} 
                          className="w-6 h-6 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded flex items-center justify-center transition-colors text-xs"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button 
                          onClick={() => moveActivityItem(idx, 1)} 
                          className="w-6 h-6 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded flex items-center justify-center transition-colors text-xs"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button 
                          onClick={() => removeActivityItem(idx)} 
                          className="w-6 h-6 bg-red-100 hover:bg-red-200 text-red-600 rounded flex items-center justify-center transition-colors text-xs"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Enhanced Add item button */}
            {adminOn && (
              <button 
                onClick={addActivityItem} 
                className="mt-4 w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <span className="text-lg">+</span>
                Add new activity item
              </button>
            )}
          </div>

          {/* Highlights Section */}
          <div className="mt-8">
            <EditableField
              value="Highlights:"
              forceEditMode={effectiveEditMode}
              onSave={async () => true}
              className="text-2xl font-bold mb-4 block"
              tag="h2"
            />
            <ul className="pl-6 space-y-3 text-gray-700 list-none">
              {(highlights || []).map((highlight, idx) => (
                <li key={idx} className="flex items-start group">
                  <span className="text-red-600 text-lg align-middle mr-2 mt-1">•</span>
                  <EditableField
                    value={highlight}
                    forceEditMode={effectiveEditMode}
                    onSave={async (value) => {
                      const updated = [...(highlights || [])];
                      updated[idx] = value;
                      return await saveArrayField('highlights', updated);
                    }}
                    className="flex-1"
                    tag="span"
                    multiline={true}
                  />
                  {adminOn && (
                    <div className="flex flex-col gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => moveHighlight(idx, -1)}
                        disabled={idx === 0}
                        className="w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded flex items-center justify-center transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveHighlight(idx, 1)}
                        disabled={idx === highlights.length - 1}
                        className="w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded flex items-center justify-center transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        ↓
                      </button>
                    <button
                      onClick={async () => {
                        const updated = (highlights || []).filter((_, i) => i !== idx);
                          await saveArrayField('highlights', updated);
                        }}
                        className="w-6 h-6 bg-red-100 hover:bg-red-200 text-red-600 rounded flex items-center justify-center transition-colors text-xs"
                      title="Remove highlight"
                    >
                      ✕
                    </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {adminOn && (
              <button
                onClick={async () => {
                  const updated = [...(highlights || []), "New highlight"];
                  await saveArrayField('highlights', updated);
                }}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                + Add Highlight
              </button>
            )}
          </div>

          {/* Included/Excluded Section */}
          <div className="mt-8">
            <EditableField
              value="Included/Excluded"
              forceEditMode={effectiveEditMode}
              onSave={async () => true}
              className="text-2xl font-bold mb-4 block"
              tag="h2"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-green-700">Included</h3>
                <ul className="space-y-4">
                  {(included || []).map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 group">
                      <span className="text-green-600">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-middle">
                          <polyline points="20 6 10 18 4 12" />
                        </svg>
                      </span>
                      <EditableField
                        value={item}
                        forceEditMode={effectiveEditMode}
                        onSave={async (value) => {
                          const updated = [...(included || [])];
                          updated[idx] = value;
                          return await saveArrayField('included', updated);
                        }}
                        className="text-green-700 flex-1"
                        tag="span"
                      />
                      {adminOn && (
                        <div className="flex flex-col gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => moveIncluded(idx, -1)}
                            disabled={idx === 0}
                            className="w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded flex items-center justify-center transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveIncluded(idx, 1)}
                            disabled={idx === included.length - 1}
                            className="w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded flex items-center justify-center transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            ↓
                          </button>
                        <button
                          onClick={async () => {
                            const updated = (included || []).filter((_, i) => i !== idx);
                              await saveArrayField('included', updated);
                            }}
                            className="w-6 h-6 bg-red-100 hover:bg-red-200 text-red-600 rounded flex items-center justify-center transition-colors text-xs"
                          title="Remove item"
                        >
                          ✕
                        </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                {adminOn && (
                  <button
                    onClick={async () => {
                      const updated = [...(included || []), "New included item"];
                      await saveArrayField('included', updated);
                    }}
                    className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    + Add Included Item
                  </button>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3 text-red-700">Excluded</h3>
                <ul className="space-y-4">
                  {(excluded || []).map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 group">
                      <span className="text-red-500">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block align-middle">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </span>
                      <EditableField
                        value={item}
                        forceEditMode={effectiveEditMode}
                        onSave={async (value) => {
                          const updated = [...(excluded || [])];
                          updated[idx] = value;
                          return await saveArrayField('excluded', updated);
                        }}
                        className="text-red-600 flex-1"
                        tag="span"
                      />
                      {adminOn && (
                        <div className="flex flex-col gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => moveExcluded(idx, -1)}
                            disabled={idx === 0}
                            className="w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded flex items-center justify-center transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveExcluded(idx, 1)}
                            disabled={idx === excluded.length - 1}
                            className="w-6 h-6 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded flex items-center justify-center transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            ↓
                          </button>
                        <button
                          onClick={async () => {
                            const updated = (excluded || []).filter((_, i) => i !== idx);
                              await saveArrayField('excluded', updated);
                            }}
                            className="w-6 h-6 bg-red-100 hover:bg-red-200 text-red-600 rounded flex items-center justify-center transition-colors text-xs"
                          title="Remove item"
                        >
                          ✕
                        </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                {adminOn && (
                  <button
                    onClick={async () => {
                      const updated = [...(excluded || []), "New excluded item"];
                      await saveArrayField('excluded', updated);
                    }}
                    className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    + Add Excluded Item
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Price and booking card */}
        <div className="w-full md:w-80 mt-10 md:mt-0 md:ml-12">
          <div className="border rounded-xl shadow p-6 flex flex-col items-center">
            <div className="w-full flex flex-col items-center mb-4">
              <EditableField
                value="From"
                onSave={async () => true}
                className="text-gray-500 text-base"
                tag="span"
              />
              <EditableField
                value={`${tourCurrency}${baseTourPrice}`}
                onSave={async (value) => {
                  // Extract price from "CHF123" or "$123" format
                  const priceMatch = value.match(/[\d.]+/);
                  if (priceMatch) {
                    return await saveBasePrice(priceMatch[0]);
                  }
                  return false;
                }}
                className="text-3xl font-bold text-gray-900"
                tag="span"
              />
              <EditableField
                value="per person"
                onSave={async () => true}
                className="text-gray-500 text-base"
                tag="span"
              />
            </div>

            {/* Admin-only ticket constraints */}
            {adminOn && (
              <div className="w-full mb-4">
                <label className="block text-sm font-medium text-gray-700">Minimum tickets per booking</label>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={minTickets}
                  onChange={async (e) => {
                    const val = Math.max(1, parseInt(e.target.value || '1', 10));
                    const updated = { ...settings, [tourKey]: { ...(settings[tourKey] || {}), minTickets: val } };
                    await saveSettings(updated);
                  }}
                />
                <label className="block text-sm font-medium text-gray-700 mt-3">Maximum total tickets (overall)</label>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={maxTotal ?? ''}
                  placeholder="e.g., 32"
                  onChange={async (e) => {
                    const valStr = e.target.value;
                    const val = valStr === '' ? null : Math.max(1, parseInt(valStr, 10));
                    const updated = { ...settings, [tourKey]: { ...(settings[tourKey] || {}), maxTotal: val } };
                    await saveSettings(updated);
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Client-side enforced now; backend enforcement can be added next.</p>
              </div>
            )}

            <div id="date-selection-section" className="w-full">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">Select Date</label>
              <input
                type="date"
                id="date"
                min={today}
                value={selectedDate}
                onChange={handleDateChange}
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </div>

            <div className="w-full mt-4">
              <label htmlFor="participants" className="block text-sm font-medium text-gray-700">Participants</label>
              <input
                type="number"
                id="participants"
                min={minTickets}
                value={participants}
                onChange={(e) => {
                  const newVal = Math.max(minTickets, parseInt(e.target.value || '1', 10));
                  console.log('First participants input changed:', { oldValue: participants, newValue: newVal, inputValue: e.target.value });
                  setParticipants(newVal);
                }}
                className="mt-1 w-full border rounded px-3 py-2"
              />
              {maxTotal !== null && participants > maxTotal && (
                <div className="text-red-600 text-xs mt-1">Exceeds maximum total tickets ({maxTotal}). Reduce participants.</div>
              )}
            </div>

            {adminOn && showPriceInput && (
              <div className="w-full mt-4">
                <label htmlFor="customPrice" className="block text-sm font-medium text-gray-700">Custom price for selected date</label>
                <input
                  type="number"
                  id="customPrice"
                  value={customPrice}
                  onChange={handleCustomPriceChange}
                  className="mt-1 w-full border rounded px-3 py-2"
                />
              </div>
            )}

            <div className="w-full text-sm text-gray-600 mb-2">
              {remainingInfo.maxTotal === null ? (
                <span>Capacity: not limited</span>
              ) : (
                <span>Remaining seats: {remainingInfo.remaining} / {remainingInfo.maxTotal}</span>
              )}
            </div>

            <button
              className={`w-full mt-4 font-bold py-3 rounded-full text-base transition-colors duration-200 ${
                selectedDate && (remainingInfo.maxTotal === null || participants <= remainingInfo.remaining)
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
              onClick={() => {
                if (!selectedDate) {
                  document.getElementById('date-selection-section')?.scrollIntoView({ behavior: 'smooth' });
                  alert('Please select a date before proceeding to check availability.');
                  return;
                }
                if (remainingInfo.maxTotal !== null && participants > remainingInfo.remaining) {
                  alert(`Only ${remainingInfo.remaining} seats remain for this date.`);
                  return;
                }
                const tourData = {
                  tourName: tourTitle,
                  tourPrice: tourPrice || 0,
                  tourCurrency: tourCurrency || "$",
                  tourId: tour?.id || "unknown",
                  selectedDate,
                  tickets: participants,
                  tourDescription: tourDescription || "Tour description"
                };
                localStorage.setItem('currentTourData', JSON.stringify(tourData));
                navigate('/flexibility', { state: { tour } });
              }}
              disabled={!selectedDate || (remainingInfo.maxTotal !== null && participants > remainingInfo.remaining)}
            >
              Check availability
            </button>
          </div>
        </div>
      </div>

      {/* Third Section - Reviews and Booking (same width as About this activity left side) */}
      <div className="flex flex-col md:flex-row justify-between items-start w-full px-6 mt-12">
        {/* Left: Reviews and Booking (same width as About this activity left side) */}
        <div className="flex-1">
          {/* Reviews Section */}
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">Highlighted reviews from other travelers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {review.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{review.name}</span>
                        <span className="text-gray-500 text-xs">- {review.country}</span>
                        <span className="text-gray-400 text-xs">{review.date}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <FaStar key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-green-600 font-medium">Verified booking</span>
                      </div>
                      <p className="text-gray-700 text-sm">{review.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Booking Section */}
          <div id="date-selection-section" className="bg-white border-2 border-orange-500 rounded-xl p-6 text-black">
            <h3 className="text-lg font-bold mb-4 text-orange-600">Select participants and date <span className="text-red-500">*</span></h3>
            <p className="text-gray-600 text-sm mb-4">Choose your group size and preferred tour date</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Participants */}
              <div className="flex items-center gap-3">
                <FaUsers className="w-5 h-5 text-orange-500" />
                              <input
                type="number"
                value={participants}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  const newVal = isNaN(val) ? minTickets : Math.max(minTickets, val);
                  console.log('Participants input changed:', { oldValue: participants, newValue: newVal, inputValue: e.target.value });
                  setParticipants(newVal);
                }}
                min={minTickets}
                className="flex-1 bg-white text-black border-2 border-orange-500 rounded-lg px-3 py-2 focus:border-orange-600 focus:outline-none"
                placeholder={`Min ${minTickets}`}
              />
              </div>
              {minTickets > 1 && (
                <p className="text-xs text-gray-600 ml-8 -mt-3">Minimum {minTickets} participants required.</p>
              )}

              {/* Date */}
              <div className="flex items-center gap-3">
                <FaCalendar className="w-5 h-5 text-orange-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  min={today}
                  className="flex-1 bg-white text-black border-2 border-orange-500 rounded-lg px-3 py-2 focus:border-orange-600 focus:outline-none"
                  placeholder="Select date"
                  required
                />
              </div>
              {!selectedDate && (
                <p className="text-red-500 text-xs mt-1 ml-8">Date selection is required</p>
              )}
            </div>

            {/* Custom Price Input (Admin Only) */}
            {adminOn && selectedDate && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Price for {selectedDate}
                  {datePrices[selectedDate] && (
                    <span className="text-green-600 ml-2">(Custom: {tourCurrency}{datePrices[selectedDate]})</span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={customPrice || datePrices[selectedDate] || baseTourPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="Enter custom price"
                    className="flex-1 bg-white text-black border-2 border-orange-500 rounded-lg px-3 py-2 focus:border-orange-600 focus:outline-none"
                  />
                  <button
                    onClick={async () => {
                      const price = customPrice || datePrices[selectedDate] || baseTourPrice;
                      const saved = await saveDatePrice(selectedDate, price);
                      if (saved) {
                        alert('Price saved successfully!');
                        setCustomPrice('');
                      } else {
                        alert('Failed to save price');
                      }
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                  >
                    Save
                  </button>
                  {datePrices[selectedDate] && (
                    <button
                      onClick={async () => {
                        const updated = { ...datePrices };
                        delete updated[selectedDate];
                        setDatePrices(updated);
                        // Also remove from database
                        await saveDatePrice(selectedDate, baseTourPrice);
                        setCustomPrice('');
                      }}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                      title="Remove custom price"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            )}



            <button 
              className={`w-full font-bold py-3 rounded-full text-base transition-colors duration-200 ${
                selectedDate 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
              onClick={() => {
                if (!selectedDate) {
                  // Scroll to date selection section and show alert
                  document.getElementById('date-selection-section')?.scrollIntoView({ behavior: 'smooth' });
                  alert('Please select a date before proceeding to check availability.');
                  return;
                }
                
                // Store tour data in localStorage for the complete booking flow
                const tourData = {
                  tourName: tourTitle,
                  tourPrice: tourPrice || 0,
                  tourCurrency: tourCurrency || "$",
                  tourId: location.state?.tour?.id || "unknown",
                  selectedDate: selectedDate,
                  tickets: participants, // Use actual participants count
                  tourDescription: tourDescription || "Tour description"
                };
                
                localStorage.setItem('currentTourData', JSON.stringify(tourData));
                console.log('Tour data stored from third button:', tourData);
                console.log('Current participants state:', participants);
                console.log('Current selectedDate state:', selectedDate);
                
                navigate('/flexibility', { state: { tour: location.state?.tour } });
              }}
              disabled={!selectedDate}
            >
              {selectedDate ? 'Check availability' : 'Select date first'}
            </button>
          </div>
        </div>
        
        {/* Right: Empty space to match About this activity layout */}
        <div className="w-full md:w-80 mt-10 md:mt-0 md:ml-12"></div>
      </div>

      {/* Overview Section */}
      <div className="w-full px-6 mt-12">
        <div className="flex-1 bg-white rounded-xl p-8 shadow">
          <EditableField
            value="Overview"
            onSave={async () => true}
            className="text-2xl font-bold mb-4 block"
            tag="h2"
          />
          <EditableField
            value={overview || "Swiss Alps Tour from Lucerne – Explore Interlaken, Grindelwald, and Lauterbrunnen"}
            onSave={async (value) => {
              if (!tour?.id) return false;
              try {
                const res = await fetch(`/api/tours/${tour.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Passcode': passcodeHeader || ''
                  },
                  body: JSON.stringify({ ...tourData, overview: value })
                });
                if (res.ok) {
                  setOverview(value);
                  setTourData(prev => ({ ...prev, overview: value }));
                  return true;
                }
                return false;
              } catch (error) {
                console.error('Error saving overview:', error);
                return false;
              }
            }}
            className="text-xl font-semibold mb-2 block text-justify"
            tag="h3"
            multiline={true}
          />
        </div>
      </div>

      {/* Pickup Locations Section */}
      <div className="w-full px-6 mt-8">
        <div className="flex-1">
          <EditableField
            value={`${pickupLocations.length} pickup location options:`}
            onSave={async () => true}
            className="text-lg font-bold mb-4 text-red-600 block"
            tag="h3"
          />
          <div className="space-y-3">
            {pickupLocations.map((location, idx) => (
              <div key={idx} className="flex items-center gap-3 group border rounded-lg p-3">
                <EditableField
                  value={location.name}
                  onSave={async (value) => {
                    if (!tour?.id) return false;
                    const updated = [...pickupLocations];
                    updated[idx] = { ...updated[idx], name: value };
                    try {
                      const res = await fetch(`/api/tours/${tour.id}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          'X-Admin-Passcode': passcodeHeader || ''
                        },
                        body: JSON.stringify({ ...tourData, pickupLocations: updated })
                      });
                      if (res.ok) {
                        setPickupLocations(updated);
                        setTourData(prev => ({ ...prev, pickupLocations: updated }));
                        return true;
                      }
                      return false;
                    } catch (error) {
                      console.error('Error saving pickup location:', error);
                      return false;
                    }
                  }}
                  className="flex-1 font-semibold"
                  tag="span"
                />
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {adminOn && (
                  <button
                    onClick={async () => {
                      const updated = pickupLocations.filter((_, i) => i !== idx);
                      if (!tour?.id) return;
                      try {
                        const res = await fetch(`/api/tours/${tour.id}`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            'X-Admin-Passcode': passcodeHeader || ''
                          },
                          body: JSON.stringify({ ...tourData, pickupLocations: updated })
                        });
                        if (res.ok) {
                          setPickupLocations(updated);
                          setTourData(prev => ({ ...prev, pickupLocations: updated }));
                        }
                      } catch (error) {
                        console.error('Error removing pickup location:', error);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 ml-2"
                    title="Remove location"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {adminOn && (
            <button
              onClick={async () => {
                const updated = [...pickupLocations, { name: "New Location", description: "" }];
                if (!tour?.id) return;
                try {
                  const res = await fetch(`/api/tours/${tour.id}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'X-Admin-Passcode': passcodeHeader || ''
                    },
                    body: JSON.stringify({ ...tourData, pickupLocations: updated })
                  });
                  if (res.ok) {
                    setPickupLocations(updated);
                    setTourData(prev => ({ ...prev, pickupLocations: updated }));
                  }
                } catch (error) {
                  console.error('Error adding pickup location:', error);
                }
              }}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              + Add Pickup Location
            </button>
          )}
        </div>
      </div>

      {/* Fourth Section - Itinerary and Google Maps */}
      <div className="flex flex-col md:flex-row justify-between items-start w-full px-6 mt-12">
        {/* Left: Itinerary (same width as About this activity left side) */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <EditableField
                value="Itinerary"
                onSave={async () => true}
                className="text-lg font-bold block"
                tag="h2"
              />
              <EditableField
                value="Follow the complete journey from pickup to return"
                onSave={async () => true}
                className="text-gray-600 text-sm block"
                tag="p"
              />
            </div>
            {adminOn && (
              <button
                onClick={async () => {
                  const newItem = { title: 'New Location', description: '', duration: '', location: '', activities: [] };
                  const updated = [...(itinerary || []), newItem];
                  await saveArrayField('itinerary', updated);
                }}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                + Add Item
              </button>
            )}
          </div>
          
          {/* Timeline */}
          <div className="relative">
            {/* Vertical line - stops at second to last item */}
            {itinerary.length > 1 && (
              <div className="absolute left-4 top-0 w-1 bg-orange-500" style={{ height: 'calc(100% - 80px)' }}></div>
            )}
            
            {/* Timeline items */}
            <div className="space-y-4">
              {(itinerary || []).length === 0 ? (
                <div className="text-gray-400 text-sm italic">
                  {adminOn ? 'Click "Add Item" to create itinerary' : 'No itinerary available'}
                </div>
              ) : (
                (itinerary || []).map((item, idx) => (
                  <div key={idx} className="flex items-start group">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 relative z-10">
                      {idx === 0 ? 'G' : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <EditableField
                        value={item?.title || ''}
                        onSave={async (value) => {
                          const updated = [...(itinerary || [])];
                          updated[idx] = { ...updated[idx], title: value };
                          return await saveItinerary(updated);
                        }}
                        className="font-bold text-sm block mb-1"
                        tag="h3"
                        placeholder="Location name..."
                      />
                      <EditableField
                        value={item?.description || item?.activities?.join(', ') || ''}
                        onSave={async (value) => {
                          const updated = [...(itinerary || [])];
                          updated[idx] = { ...updated[idx], description: value, activities: value.split(',').map(a => a.trim()) };
                          return await saveItinerary(updated);
                        }}
                        className="text-gray-600 text-xs font-bold block"
                        tag="p"
                        placeholder="Activities (comma-separated)..."
                      />
                    </div>
                    {adminOn && (
                      <button
                        onClick={async () => {
                          const updated = (itinerary || []).filter((_, i) => i !== idx);
                          await saveItinerary(updated);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 ml-2"
                        title="Remove item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Disclaimer */}
            <div className="flex items-start mt-8">
              <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs mr-3">
                i
              </div>
              <p className="text-gray-600 text-sm">For reference only. Itineraries are subject to change.</p>
            </div>
          </div>
        </div>

        {/* Right: Google Maps */}
        <div className="w-full md:w-80 mt-10 md:mt-0 md:ml-12">
          <div className="border rounded-xl shadow-sm overflow-hidden">
            {/* Map Header */}
            <div className="bg-white p-4 border-b">
              <button className="bg-orange-500 text-white px-4 py-2 rounded text-sm font-medium">
                Re-center
              </button>
            </div>
            
            {/* Map Container */}
            <div className="h-96 bg-gray-100 relative">
              {/* Google Maps Interactive Map */}
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m76!1m12!1m3!1d693334.9418823748!2d8.235415554166067!3d47.38223286958266!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m61!3e0!4m5!1s0x47900b9749bea219%3A0xe66e8df1e71fdc03!2sZ%C3%BCrich%2C%20Switzerland!3m2!1d47.3768866!2d8.541694!4m5!1s0x47906c3360221447%3A0x48f8db9bc2ce3fa7!2sRhine%20Falls%2C%20Rheinfallquai%2C%20Neuhausen%20am%20Rheinfall%2C%20Switzerland!3m2!1d47.6770072!2d8.6151104!4m5!1s0x479b1bd3e7c8f877%3A0x5c32e5a998a2ab4!2sMeersburg%2C%20Germany!3m2!1d47.6949444!2d9.2721111!4m5!1s0x479b23df8a3276cb%3A0x5a678ae1c4c2da1b!2sLindau%20(Bodensee)%2C%20Germany!3m2!1d47.5464809!2d9.6834693!4m5!1s0x479ce4d7bb0e0c85%3A0xe6f5db3629b64730!2sBregenz%2C%20Austria!3m2!1d47.5048677!2d9.7473627!4m5!1s0x479ce43779edc2a1%3A0x85c22e2eae74b01b!2sVaduz%2C%20Liechtenstein!3m2!1d47.1410409!2d9.5209277!4m5!1s0x47900b9749bea219%3A0xe66e8df1e71fdc03!2sZ%C3%BCrich%2C%20Switzerland!3m2!1d47.3768866!2d8.541694!5e0!3m2!1sen!2s!4v1704963600000!5m2!1sen!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 w-full h-full"
              ></iframe>
              
              {/* Map Controls */}
              <div className="absolute top-4 right-4">
                <button className="bg-white p-2 rounded shadow-sm">
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM13 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zM13 10a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" />
                  </svg>
                </button>
              </div>
              
              <div className="absolute bottom-4 right-4">
                <button className="bg-white p-2 rounded shadow-sm">
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Map Footer */}
            <div className="bg-white p-3 text-xs text-gray-500 border-t">
              <div className="flex items-center justify-between">
                <span>Map data ©2025 GeoBasis-DE/BKG (©2009), Google Terms</span>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>Main stop</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
 