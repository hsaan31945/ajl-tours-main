
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { switzerlandTours, normalizeSwissId } from "../data/switzerlandTours";
import Button from "../components/Button";
import FeaturesSection from "../components/FeaturesSection";
import ImageCarousel from "../components/ImageCarousel";
import { useCurrency } from "../context/CurrencyContext";
import { useAdmin } from "../context/AdminContext";
import { useEditMode } from "../context/EditModeContext";
import EditableText from "../components/EditableText";
import TourEditWizard from "../components/TourEditWizard";

const locationPin = (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline-block text-red-600 align-middle mx-1">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21c-4.418 0-8-5.373-8-10a8 8 0 1116 0c0 4.627-3.582 10-8 10z" />
    <circle cx="12" cy="11" r="3" stroke="currentColor" strokeWidth={2} fill="white" />
  </svg>
);

const SwitzerlandTourDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { symbol, rate } = useCurrency();
  const { passcodeHeader, isAdmin } = useAdmin();
  const { isEditMode, setIsEditMode } = useEditMode();
  
  // Tour state - fetched from API or fallback to hardcoded
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Single state for all editing functionality
  const [allEditMode, setAllEditMode] = useState(false);
  
  // When any edit mode is active, all elements should be editable
  const effectiveEditMode = isEditMode || allEditMode;
  
  // State for Tour Edit Wizard
  const [showEditWizard, setShowEditWizard] = useState(false);
  const [overrides, setOverrides] = useState({});
  const [tourData, setTourData] = useState({});

  // Fetch tour from API or fallback to hardcoded data
  useEffect(() => {
    const fetchTour = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // First, try to fetch from API
        const response = await fetch(`/api/tours/${id}`);
        if (response.ok) {
          const data = await response.json();
          // Map API data to expected format
          const mappedTour = {
            id: data._id || data.id,
            name: data.name,
            desc: data.description || data.overview || '',
            price: data.price,
            rating: data.metadata?.rating || 4.9,
            reviews: data.metadata?.reviews || 0,
            images: data.images || [],
            features: data.metadata?.features || data.included || [],
            itinerary: Array.isArray(data.itinerary) 
              ? data.itinerary.map(item => typeof item === 'string' ? item : item.location || item.title || '')
              : [],
            address: data.startLocation || data.metadata?.address || 'Zurich, Switzerland',
            duration: data.duration || '10 hours',
            provider: 'AJL Tours'
          };
          setTour(mappedTour);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.log('API fetch failed, trying hardcoded data:', err);
      }
      
      // Fallback to hardcoded data
      const normalizedId = normalizeSwissId(id);
      const hardcodedTour = switzerlandTours.find((t) => t.id === normalizedId);
      
      if (hardcodedTour) {
        setTour(hardcodedTour);
      } else {
        setError('Tour not found');
      }
      setLoading(false);
    };
    
    fetchTour();
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/content/homepage/tour_details');
        if (res.ok) {
          const data = await res.json();
          setOverrides(data?.content || {});
        }
        
        // Initialize tour data with default values
        if (tour) {
          setTourData({
            name: tour.name,
            desc: tour.desc,
            price: tour.price,
            rating: tour.rating,
            reviews: tour.reviews,
            images: tour.images || []
          });
        }
      } catch (e) {}
    })();
  }, [tour]);

  const saveOverrides = async (updated) => {
    try {
      const res = await fetch('/api/admin/content/tour_details', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': passcodeHeader || ''
        },
        body: JSON.stringify({ content: updated })
      });
      if (!res.ok) return false;
      setOverrides(updated);
      return true;
    } catch (e) { return false; }
  };
  
  // Save tour data updates
  const saveTourData = async (field, value) => {
    if (!isAdmin) return false;
    try {
      setTourData(prev => ({ ...prev, [field]: value }));
      // In a real implementation, you would save to the database here
      return true;
    } catch (e) {
      return false;
    }
  };

  if (loading) {
    return <div className="text-center mt-20 text-xl text-gray-600">Loading tour details...</div>;
  }

  if (error || !tour) {
    return <div className="text-center mt-20 text-xl text-red-600">Tour not found.</div>;
  }

  
  // Use tourData for editable fields
  const displayName = tourData.name || tour.name;
  const displayDesc = tourData.desc || tour.desc;
  const displayPrice = tourData.price || tour.price;
  const displayRating = tourData.rating || tour.rating;
  const displayReviews = tourData.reviews || tour.reviews;

  const defaultRoute = tour.itinerary || (tour.id === '01' ? [
    'Zurich','Meersburg','Lindau','Bregenz','Vaduz','Zurich'
  ] : []);
  const key = tour.id;
  const eff = overrides[key] || {};
  const effectiveRoutes = Array.isArray(eff.routes) ? eff.routes : defaultRoute;
  const effectiveFeatures = Array.isArray(eff.features) ? eff.features : (tour.features || []);

  const updateAndSave = async (next) => {
    const updated = { ...overrides, [key]: { ...(overrides[key] || {}), ...next } };
    return await saveOverrides(updated);
  };

  const addRoute = async () => { if (!isAdmin) return; await updateAndSave({ routes: [...effectiveRoutes, 'New Stop'] }); };
  const removeRoute = async (idx) => { if (!isAdmin) return; const r = effectiveRoutes.filter((_, i) => i !== idx); await updateAndSave({ routes: r }); };
  const moveRoute = async (idx, dir) => { if (!isAdmin) return; const t = idx + dir; if (t < 0 || t >= effectiveRoutes.length) return; const r = [...effectiveRoutes]; [r[idx], r[t]] = [r[t], r[idx]]; await updateAndSave({ routes: r }); };
  const saveRouteText = (idx) => async (text) => { const r = [...effectiveRoutes]; r[idx] = text; return await updateAndSave({ routes: r }); };

  const addFeature = async () => { if (!isAdmin) return; await updateAndSave({ features: [...effectiveFeatures, 'New Feature'] }); };
  const removeFeature = async (idx) => { if (!isAdmin) return; const f = effectiveFeatures.filter((_, i) => i !== idx); await updateAndSave({ features: f }); };
  const moveFeature = async (idx, dir) => { if (!isAdmin) return; const t = idx + dir; if (t < 0 || t >= effectiveFeatures.length) return; const f = [...effectiveFeatures]; [f[idx], f[t]] = [f[t], f[idx]]; await updateAndSave({ features: f }); };
  const saveFeatureText = (idx) => async (text) => { const f = [...effectiveFeatures]; f[idx] = text; return await updateAndSave({ features: f }); };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full">
        {/* Edit Tour Button at the top */}
        <div className="w-full p-4 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
          <div className="flex gap-2">
            {/* All Edit Toggle - When active, all elements become editable */}
            <button 
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${allEditMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              onClick={() => {
                const newEditMode = !allEditMode;
                setAllEditMode(newEditMode);
                // Show notification about edit mode
                if (newEditMode) {
                  alert('ALL EDIT MODE ENABLED\n\nNow you can:\n1. Click pencil icons next to any text to edit it\n2. Click on the "Edit field" option\n3. Modify the content and press Enter to save\n\nClick the blue button again to exit edit mode.');
                } else {
                  alert('All edit mode disabled.');
                }
              }}
            >
              {allEditMode ? 'Exit All Edit' : 'All Edit Tour'}
            </button>
            
            {/* Admin Edit Toggle */}
            {isAdmin && (
              <button 
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${isEditMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                onClick={() => {
                  const newEditMode = !isEditMode;
                  setIsEditMode(newEditMode);
                  // Show notification about edit mode
                  if (newEditMode) {
                    alert('ADMIN EDIT MODE ENABLED\n\nNow you can:\n1. Right-click on any text to edit it\n2. Click on the "Edit field" option\n3. Modify the content and press Enter to save\n\nClick this button again to exit edit mode.');
                  } else {
                    alert('Admin edit mode disabled.');
                  }
                }}
              >
                {isEditMode ? 'Exit Admin Edit' : 'Admin Edit Tour'}
              </button>
            )}
            
            {/* Tour Edit Wizard - Comprehensive editing interface */}
            <button 
              className="px-4 py-2 rounded-lg transition-colors font-medium bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => {
                if (tour) {
                  setShowEditWizard(true);
                } else {
                  alert('Tour data not loaded yet. Please wait and try again.');
                }
              }}
            >
              Edit Tour Wizard
            </button>
          </div>
          
          {(isEditMode || allEditMode) && (
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Edit Mode Active
            </div>
          )}
        </div>
        <div className="pt-2.5 px-2.5 bg-white rounded-t-xl">
          <div className="relative">
            <ImageCarousel images={tour.images} alt={tour.name} className="rounded-t-xl" />
            {isAdmin && (
              <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-xs">
                <EditableText
                  tag="span"
                  className="text-xs"
                  onSave={(text) => saveTourData('imageCaption', text)}
                >
                  Edit Images
                </EditableText>
              </div>
            )}
          </div>
        </div>
        <div className="p-8 flex flex-col items-center">
          <h1 className="text-3xl font-bold mb-2 text-black flex items-center">
            <EditableText
              tag="span"
              className="text-3xl font-bold mb-2 text-black"
              onSave={(text) => saveTourData('name', text)}
            >
              {displayName}
            </EditableText>
            {(isEditMode || manualEditMode) && (
              <button 
                className="ml-2 text-gray-500 hover:text-blue-600"
                onClick={() => {
                  // Trigger edit mode for the tour name
                  const element = document.querySelector('.text-3xl.font-bold.mb-2.text-black');
                  if (element) {
                    const event = new MouseEvent('contextmenu', {
                      bubbles: true,
                      cancelable: true,
                      clientX: element.getBoundingClientRect().left,
                      clientY: element.getBoundingClientRect().top
                    });
                    element.dispatchEvent(event);
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            )}
          </h1>
          <div className="text-lg font-bold text-red-600 mb-2 flex items-center">
            {symbol}
            <EditableText
              tag="span"
              className="text-lg font-bold text-red-600"
              onSave={(text) => saveTourData('price', parseFloat(text.replace(/[^0-9.]/g, '')))}
            >
              {(displayPrice * rate).toFixed(2)}
            </EditableText>
            <span className="text-sm text-gray-500">/person</span>
            {(isEditMode || manualEditMode) && (
              <button 
                className="ml-2 text-gray-500 hover:text-blue-600"
                onClick={() => {
                  // Trigger edit mode for the price
                  const element = document.querySelector('.text-lg.font-bold.text-red-600');
                  if (element) {
                    const event = new MouseEvent('contextmenu', {
                      bubbles: true,
                      cancelable: true,
                      clientX: element.getBoundingClientRect().left,
                      clientY: element.getBoundingClientRect().top
                    });
                    element.dispatchEvent(event);
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            )}
          </div>
          {/* Rating display for tours with rating */}
          {displayRating && (
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < Math.floor(displayRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-2 text-sm text-gray-600 flex items-center">
                  <EditableText
                    tag="span"
                    className="ml-2 text-sm text-gray-600"
                    onSave={(text) => saveTourData('rating', parseFloat(text.split(' ')[0]))}
                  >
                    {displayRating}
                  </EditableText>
                  out of 5 stars (
                  <EditableText
                    tag="span"
                    className="text-sm text-gray-600"
                    onSave={(text) => saveTourData('reviews', parseInt(text.replace(/[^0-9]/g, '')))}
                  >
                    {displayReviews}
                  </EditableText>
                  reviews)
                  {(isEditMode || manualEditMode) && (
                    <button 
                      className="ml-2 text-gray-500 hover:text-blue-600"
                      onClick={() => {
                        // Trigger edit mode for the rating
                        const element = document.querySelector('.ml-2.text-sm.text-gray-600');
                        if (element) {
                          const event = new MouseEvent('contextmenu', {
                            bubbles: true,
                            cancelable: true,
                            clientX: element.getBoundingClientRect().left,
                            clientY: element.getBoundingClientRect().top
                          });
                          element.dispatchEvent(event);
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  )}
                </span>
              </div>
            </div>
          )}
          <p className="text-gray-700 text-center mb-4 flex items-start">
            <EditableText
              tag="p"
              className="text-gray-700 text-center mb-4 flex-grow"
              onSave={(text) => saveTourData('desc', text)}
              multiline={true}
            >
              {displayDesc}
            </EditableText>
            {(isEditMode || manualEditMode) && (
              <button 
                className="ml-2 mt-1 text-gray-500 hover:text-blue-600"
                onClick={() => {
                  // Trigger edit mode for the description
                  const element = document.querySelector('.text-gray-700.text-center.mb-4');
                  if (element) {
                    const event = new MouseEvent('contextmenu', {
                      bubbles: true,
                      cancelable: true,
                      clientX: element.getBoundingClientRect().left,
                      clientY: element.getBoundingClientRect().top
                    });
                    element.dispatchEvent(event);
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            )}
          </p>
          <div className="w-full flex flex-col md:flex-row gap-8 items-start justify-center mb-6">
            {/* Left: Tour Route */}
            <div className="flex-1 flex flex-col items-center md:items-start">
              <h2 className="text-xl font-bold text-black mb-4 flex items-center">
                <EditableText
                  tag="span"
                  className="text-xl font-bold text-black"
                  onSave={(text) => saveTourData('routeTitle', text)}
                >
                  Tour Route
                </EditableText>
                {(isEditMode || manualEditMode) && (
                  <button 
                    className="ml-2 text-gray-500 hover:text-blue-600"
                    onClick={() => {
                      // Trigger edit mode for the route title
                      const element = document.querySelector('.text-xl.font-bold.text-black.mb-4');
                      if (element) {
                        const event = new MouseEvent('contextmenu', {
                          bubbles: true,
                          cancelable: true,
                          clientX: element.getBoundingClientRect().left,
                          clientY: element.getBoundingClientRect().top
                        });
                        element.dispatchEvent(event);
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                )}
              </h2>
              <div className="flex flex-col items-start justify-center w-full relative gap-2">
                {effectiveRoutes.map((stop, idx) => (
                  <div key={idx} className="flex items-start w-full">
                    <div className="flex flex-col items-center mt-0.5">
                      {locationPin}
                      {idx !== effectiveRoutes.length - 1 && <div className="w-1 h-6 bg-gray-300" />}
                    </div>
                    <div className="ml-3 flex-1 flex items-center gap-2">
                      <EditableText
                        tag="span"
                        className="text-base font-semibold text-gray-800"
                        onSave={saveRouteText(idx)}
                      >
                        {stop}
                      </EditableText>
                      {(isEditMode || manualEditMode) && (
                        <div className="ml-auto flex gap-1">
                          <button 
                            onClick={() => moveRoute(idx, -1)} 
                            className="px-2 py-0.5 text-xs bg-white border rounded hover:bg-gray-100"
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button 
                            onClick={() => moveRoute(idx, 1)} 
                            className="px-2 py-0.5 text-xs bg-white border rounded hover:bg-gray-100"
                            title="Move down"
                          >
                            ↓
                          </button>
                          <button 
                            onClick={() => removeRoute(idx)} 
                            className="px-2 py-0.5 text-xs bg-white border rounded text-red-600 hover:bg-red-50"
                            title="Remove stop"
                          >
                            ✕
                          </button>
                          <button 
                            className="px-2 py-0.5 text-xs bg-white border rounded text-blue-600 hover:bg-blue-50"
                            title="Edit stop"
                            onClick={() => {
                              // Trigger edit mode for this route stop
                              const elements = document.querySelectorAll('.text-base.font-semibold.text-gray-800');
                              if (elements[idx]) {
                                const element = elements[idx];
                                const event = new MouseEvent('contextmenu', {
                                  bubbles: true,
                                  cancelable: true,
                                  clientX: element.getBoundingClientRect().left,
                                  clientY: element.getBoundingClientRect().top
                                });
                                element.dispatchEvent(event);
                              }
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {(isEditMode || manualEditMode) && (
                  <button onClick={addRoute} className="mt-2 px-3 py-1 text-xs bg-white border rounded self-start hover:bg-gray-100 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Stop
                  </button>
                )}
              </div>
            </div>
            {/* Right: Features */}
            <div className="flex-1 w-full mt-8 md:mt-0">
              <h2 className="text-xl font-semibold mb-2 text-black flex items-center">
                <EditableText
                  tag="span"
                  className="text-xl font-semibold mb-2 text-black"
                  onSave={(text) => saveTourData('featuresTitle', text)}
                >
                  Features We Offer
                </EditableText>
                {(isEditMode || manualEditMode) && (
                  <button 
                    className="ml-2 text-gray-500 hover:text-blue-600"
                    onClick={() => {
                      // Trigger edit mode for the features title
                      const element = document.querySelector('.text-xl.font-semibold.mb-2.text-black');
                      if (element) {
                        const event = new MouseEvent('contextmenu', {
                          bubbles: true,
                          cancelable: true,
                          clientX: element.getBoundingClientRect().left,
                          clientY: element.getBoundingClientRect().top
                        });
                        element.dispatchEvent(event);
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                )}
              </h2>
              <ul className="list-disc list-inside text-gray-700 mb-2 space-y-1">
                {effectiveFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <EditableText
                      tag="span"
                      className="flex-grow"
                      onSave={saveFeatureText(idx)}
                    >
                      {feature}
                    </EditableText>
                    {(isEditMode || manualEditMode) && (
                      <div className="flex gap-1">
                        <button 
                          onClick={() => moveFeature(idx, -1)} 
                          className="px-2 py-0.5 text-xs bg-white border rounded hover:bg-gray-100"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button 
                          onClick={() => moveFeature(idx, 1)} 
                          className="px-2 py-0.5 text-xs bg-white border rounded hover:bg-gray-100"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button 
                          onClick={() => removeFeature(idx)} 
                          className="px-2 py-0.5 text-xs bg-white border rounded text-red-600 hover:bg-red-50"
                          title="Remove feature"
                        >
                          ✕
                        </button>
                        <button 
                          className="px-2 py-0.5 text-xs bg-white border rounded text-blue-600 hover:bg-blue-50"
                          title="Edit feature"
                          onClick={() => {
                            // Trigger edit mode for this feature
                            const elements = document.querySelectorAll('.flex-grow');
                            if (elements[idx]) {
                              const element = elements[idx];
                              const event = new MouseEvent('contextmenu', {
                                bubbles: true,
                                cancelable: true,
                                clientX: element.getBoundingClientRect().left,
                                clientY: element.getBoundingClientRect().top
                              });
                              element.dispatchEvent(event);
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {(isEditMode || manualEditMode) && (
                <button onClick={addFeature} className="mt-2 px-3 py-1 text-xs bg-white border rounded hover:bg-gray-100 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Feature
                </button>
              )}
            </div>
          </div>
          <div className="relative">
            <Button
              onClick={() => navigate("/booking", { state: { tour: { id: tour.id, title: tour.name, price: tour.price } } })}
            >
              <EditableText
                tag="span"
                onSave={(text) => saveTourData('proceedButtonText', text)}
              >
                Proceed to Booking
              </EditableText>
            </Button>
            {(isEditMode || manualEditMode) && (
              <button 
                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md text-gray-500 hover:text-blue-600 border"
                onClick={() => {
                  // Trigger edit mode for the button text
                  const element = document.querySelector('button > span');
                  if (element) {
                    const event = new MouseEvent('contextmenu', {
                      bubbles: true,
                      cancelable: true,
                      clientX: element.getBoundingClientRect().left,
                      clientY: element.getBoundingClientRect().top
                    });
                    element.dispatchEvent(event);
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            )}
          </div>
          <div className="relative">
            <Button
              onClick={() => navigate(`/switzerland/${tour.id}/checkout-sw`, { state: { tour } })}
              className="mt-4 bg-black text-white"
            >
              <EditableText
                tag="span"
                onSave={(text) => saveTourData('checkoutButtonText', text)}
              >
                Go to Checkout
              </EditableText>
            </Button>
            {(isEditMode || manualEditMode) && (
              <button 
                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md text-gray-500 hover:text-blue-600 border"
                onClick={() => {
                  // Trigger edit mode for the button text
                  const elements = document.querySelectorAll('button > span');
                  if (elements[1]) {
                    const element = elements[1];
                    const event = new MouseEvent('contextmenu', {
                      bubbles: true,
                      cancelable: true,
                      clientX: element.getBoundingClientRect().left,
                      clientY: element.getBoundingClientRect().top
                    });
                    element.dispatchEvent(event);
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            )}
          </div>
          {/* Checkout 2.0 button for ALL Switzerland tours */}
          <div className="relative">
            <Button
              onClick={() => navigate(`/visit-checkout-2`, { state: { tour } })}
              className="mt-4 bg-red-600 text-white hover:bg-red-700"
            >
              <EditableText
                tag="span"
                onSave={(text) => saveTourData('checkout2ButtonText', text)}
              >
                Checkout 2.0
              </EditableText>
            </Button>
            {(isEditMode || manualEditMode) && (
              <button 
                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md text-gray-500 hover:text-blue-600 border"
                onClick={() => {
                  // Trigger edit mode for the button text
                  const elements = document.querySelectorAll('button > span');
                  if (elements[2]) {
                    const element = elements[2];
                    const event = new MouseEvent('contextmenu', {
                      bubbles: true,
                      cancelable: true,
                      clientX: element.getBoundingClientRect().left,
                      clientY: element.getBoundingClientRect().top
                    });
                    element.dispatchEvent(event);
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwitzerlandTourDetails; 