import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { normalizeTourData } from '../utils/tourDataMapper';
import { apiUrl } from '../utils/api';

const cleanTextArray = (items) => (
  Array.isArray(items)
    ? items.map((item) => String(item || '').trim()).filter(Boolean)
    : []
);

const cleanItinerary = (items) => (
  Array.isArray(items)
    ? items
        .map((item) => ({
          title: String(item?.title || '').trim(),
          description: String(item?.description || '').trim(),
          duration: String(item?.duration || '').trim(),
          location: String(item?.location || '').trim(),
          type: String(item?.type || '').trim(),
          activities: cleanTextArray(item?.activities),
        }))
        .filter((item) => item.title || item.description || item.duration || item.location || item.type || item.activities.length)
    : []
);

const TourEditWizard = ({ tour, initialTourData, isOpen, onClose, onSave }) => {
  const { passcodeHeader } = useAdmin();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    overview: '',
    price: '',
    discountEnabled: false,
    discountPrice: '',
    duration: '',
    tourType: '',
    reviewText: '',
    isActive: true,
    highlights: [],
    included: [],
    excluded: [],
    itinerary: [],
    datePrices: {}
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tourId, setTourId] = useState(null); // Store tour ID separately

  const steps = [
    { id: 'basic', title: 'Basic Information' },
    { id: 'overview', title: 'Overview' },
    { id: 'description', title: 'Description' },
    { id: 'details', title: 'Tour Details' },
    { id: 'highlights', title: 'Highlights' },
    { id: 'inclusion', title: 'Inclusions & Exclusions' },
    { id: 'itinerary', title: 'Itinerary' },
    { id: 'pricing', title: 'Pricing' }
  ];

  useEffect(() => {
    // Use initialTourData if provided (for AdminUpdateTours) or tour if provided (for modal usage)
    const tourToUse = initialTourData || tour;
    const shouldLoadData = (initialTourData || tour) && (isOpen || initialTourData); // Load if isOpen is true OR if initialTourData is provided (for non-modal usage)
    
    if (shouldLoadData) {
      const normalizedTour = normalizeTourData(tourToUse);
      
      // Store the tour ID for later use
      const idToStore = normalizedTour.id || normalizedTour._id || tourToUse?._id || tourToUse?.id;
      if (idToStore) {
        setTourId(idToStore);
      }
      
      // Log for debugging data consistency
      console.log('TourEditWizard - Tour Data for Editing:', {
        id: normalizedTour.id,
        storedTourId: idToStore,
        name: normalizedTour.name,
        price: normalizedTour.price,
        duration: normalizedTour.duration,
        highlightsCount: normalizedTour.highlights?.length || 0,
        includedCount: normalizedTour.included?.length || 0,
        excludedCount: normalizedTour.excluded?.length || 0,
        itineraryCount: normalizedTour.itinerary?.length || 0
      });
      
      setFormData({
        name: normalizedTour.name || '',
        description: normalizedTour.description || '',
        overview: normalizedTour.overview || '',
        price: normalizedTour.price || '',
        discountEnabled: Boolean(normalizedTour.discountEnabled),
        discountPrice: normalizedTour.discountPrice ?? '',
        duration: normalizedTour.duration || '',
        tourType: normalizedTour.type || '',
        reviewText: normalizedTour.reviewText || '',
        isActive: normalizedTour.isActive !== false,
        highlights: Array.isArray(normalizedTour.highlights) ? [...normalizedTour.highlights] : [],
        included: Array.isArray(normalizedTour.included) ? [...normalizedTour.included] : [],
        excluded: Array.isArray(normalizedTour.excluded) ? [...normalizedTour.excluded] : [],
        itinerary: Array.isArray(normalizedTour.itinerary) ? normalizedTour.itinerary.map((item) => ({ ...item })) : [],
        datePrices: normalizedTour.datePrices || {}
      });
    }
  }, [initialTourData, tour, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: (Array.isArray(prev[field]) ? prev[field] : []).map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field, defaultValue = '') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(Array.isArray(prev[field]) ? prev[field] : []), defaultValue]
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: (Array.isArray(prev[field]) ? prev[field] : []).filter((_, i) => i !== index)
    }));
  };

  const moveArrayItem = (field, fromIndex, toIndex) => {
    setFormData(prev => {
      const newArray = [...(Array.isArray(prev[field]) ? prev[field] : [])];
      if (toIndex < 0 || toIndex >= newArray.length) return prev;
      const [movedItem] = newArray.splice(fromIndex, 1);
      newArray.splice(toIndex, 0, movedItem);
      return { ...prev, [field]: newArray };
    });
  };

  const updateItineraryField = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      itinerary: (Array.isArray(prev.itinerary) ? prev.itinerary : []).map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      ))
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Use stored tourId first, then fallback to props
      const idToUse = tourId || (initialTourData?._id || initialTourData?.id) || (tour?._id || tour?.id);
      
      console.log('TourEditWizard - Getting tour ID for save:', {
        storedTourId: tourId,
        hasInitialTourData: !!initialTourData,
        hasTour: !!tour,
        initialTourDataId: initialTourData?._id || initialTourData?.id,
        tourIdFromProp: tour?._id || tour?.id,
        finalTourId: idToUse
      });
      
      if (!idToUse) {
        console.error('TourEditWizard - Missing tour ID. storedTourId:', tourId, 'initialTourData:', initialTourData, 'tour:', tour);
        alert('Error: Tour ID is missing. Cannot save tour. Please refresh and try again.');
        setLoading(false);
        return;
      }
      
      // Prepare data for API - ensure price is a number
      const dataToSend = {
        ...formData,
        price: formData.price ? Number(formData.price) : formData.price,
        discountEnabled: Boolean(formData.discountEnabled),
        discountPrice: formData.discountEnabled && formData.discountPrice !== ''
          ? Number(formData.discountPrice)
          : null,
        highlights: cleanTextArray(formData.highlights),
        included: cleanTextArray(formData.included),
        excluded: cleanTextArray(formData.excluded),
        itinerary: cleanItinerary(formData.itinerary),
      };
      
      console.log('TourEditWizard - Sending data to API:', {
        tourId: idToUse,
        dataToSend: {
          ...dataToSend,
          highlights: dataToSend.highlights || [],
          included: dataToSend.included || [],
          excluded: dataToSend.excluded || [],
          itinerary: dataToSend.itinerary || []
        }
      });
      console.log('TourEditWizard - Highlights:', dataToSend.highlights);
      console.log('TourEditWizard - Included:', dataToSend.included);
      console.log('TourEditWizard - Excluded:', dataToSend.excluded);
      console.log('TourEditWizard - Itinerary:', dataToSend.itinerary);
      
      const response = await fetch(apiUrl(`/api/tours/${idToUse}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': passcodeHeader || ''
        },
        body: JSON.stringify(dataToSend)
      });

      const responseData = await response.json();
      
      if (response.ok) {
        console.log('Tour saved successfully - API response:', responseData);
        await onSave(responseData); // Pass the actual saved tour from database
        if (onClose) onClose(); // Only call onClose if it exists (for modal usage)
      } else {
        console.error('Failed to save tour:', response.status, responseData);
        alert('Failed to save tour: ' + (responseData.message || responseData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving tour:', error);
      alert('Error saving tour: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Basic Information
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tour Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter tour name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Price</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter price"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Discount</label>
              <label className="flex items-center justify-between gap-4 border rounded-lg px-3 py-2 bg-white cursor-pointer">
                <span>
                  <span className="block font-semibold text-gray-900">
                    {formData.discountEnabled ? 'Discount active' : 'No discount'}
                  </span>
                  <span className="block text-xs text-gray-500">
                    Customers see the original price crossed out
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={formData.discountEnabled}
                  onChange={(e) => handleInputChange('discountEnabled', e.target.checked)}
                  className="h-5 w-5 accent-orange-600"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Discounted Price</label>
              <input
                type="number"
                min="0"
                value={formData.discountPrice}
                onChange={(e) => handleInputChange('discountPrice', e.target.value)}
                disabled={!formData.discountEnabled}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                placeholder="Leave blank for no discount"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Public Status</label>
              <label className="flex items-center justify-between gap-4 border rounded-lg px-3 py-2 bg-white cursor-pointer">
                <span>
                  <span className="block font-semibold text-gray-900">
                    {formData.isActive !== false ? 'Active' : 'Draft'}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {formData.isActive !== false ? 'Visible to customers' : 'Hidden from customers'}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={formData.isActive !== false}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="h-5 w-5 accent-orange-600"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Duration</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter duration (e.g., 12 hours)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tour Type</label>
              <input
                type="text"
                value={formData.tourType}
                onChange={(e) => handleInputChange('tourType', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter tour type"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Review Text</label>
              <input
                type="text"
                value={formData.reviewText}
                onChange={(e) => handleInputChange('reviewText', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter review text"
              />
            </div>
          </div>
        );

      case 1: // Overview
        return (
          <div>
            <label className="block text-sm font-medium mb-2">Tour Overview</label>
            <textarea
              value={formData.overview}
              onChange={(e) => handleInputChange('overview', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
              placeholder="Enter a brief overview of the tour"
            />
            <p className="text-xs text-gray-500 mt-1">This section provides a concise summary of what the tour offers.</p>
          </div>
        );

      case 2: // Description
        return (
          <div>
            <label className="block text-sm font-medium mb-2">Tour Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
              placeholder="Enter detailed tour description"
            />
          </div>
        );

      case 3: // Tour Details
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tour Duration</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter duration"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tour Type</label>
              <input
                type="text"
                value={formData.tourType}
                onChange={(e) => handleInputChange('tourType', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter tour type"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Review Text</label>
              <input
                type="text"
                value={formData.reviewText}
                onChange={(e) => handleInputChange('reviewText', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter review text"
              />
            </div>
          </div>
        );

      case 4: // Highlights
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium mb-2">Tour Highlights</label>
            {formData.highlights.map((highlight, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={highlight}
                  onChange={(e) => handleArrayChange('highlights', index, e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter highlight"
                />
                <button
                  type="button"
                  onClick={() => moveArrayItem('highlights', index, index - 1)}
                  disabled={index === 0}
                  className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveArrayItem('highlights', index, index + 1)}
                  disabled={index === formData.highlights.length - 1}
                  className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeArrayItem('highlights', index)}
                  className="px-2 py-1 bg-red-500 text-white rounded"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('highlights', '')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add Highlight
            </button>
          </div>
        );

      case 5: // Inclusions & Exclusions
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Included Items</label>
              {formData.included.map((item, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleArrayChange('included', index, e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter included item"
                  />
                  <button
                    type="button"
                    onClick={() => moveArrayItem('included', index, index - 1)}
                    disabled={index === 0}
                    className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveArrayItem('included', index, index + 1)}
                    disabled={index === formData.included.length - 1}
                    className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeArrayItem('included', index)}
                    className="px-2 py-1 bg-red-500 text-white rounded"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('included', '')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mb-4"
              >
                Add Included Item
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Excluded Items</label>
              {formData.excluded.map((item, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleArrayChange('excluded', index, e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter excluded item"
                  />
                  <button
                    type="button"
                    onClick={() => moveArrayItem('excluded', index, index - 1)}
                    disabled={index === 0}
                    className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveArrayItem('excluded', index, index + 1)}
                    disabled={index === formData.excluded.length - 1}
                    className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeArrayItem('excluded', index)}
                    className="px-2 py-1 bg-red-500 text-white rounded"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('excluded', '')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Add Excluded Item
              </button>
            </div>
          </div>
        );

      case 6: // Itinerary
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium mb-2">Tour Itinerary</label>
            <p className="text-xs text-gray-500 mb-3">Add detailed information about each day/stop of the tour</p>
            {formData.itinerary.map((item, index) => (
              <div key={index} className="border p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={item.title || ''}
                    onChange={(e) => updateItineraryField(index, 'title', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Day/Stop Title"
                  />
                  <button
                    type="button"
                    onClick={() => moveArrayItem('itinerary', index, index - 1)}
                    disabled={index === 0}
                    className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveArrayItem('itinerary', index, index + 1)}
                    disabled={index === formData.itinerary.length - 1}
                    className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeArrayItem('itinerary', index)}
                    className="px-2 py-1 bg-red-500 text-white rounded"
                  >
                    ×
                  </button>
                </div>
                <textarea
                  value={item.description || ''}
                  onChange={(e) => updateItineraryField(index, 'description', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Day/Stop Description"
                />
                <div className="mt-2">
                  <label className="text-xs text-gray-600">Location:</label>
                  <input
                    type="text"
                    value={item.location || ''}
                    onChange={(e) => updateItineraryField(index, 'location', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm mt-1"
                    placeholder="Location for this day/stop"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('itinerary', { title: '', description: '', location: '' })}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add Itinerary Item
            </button>
          </div>
        );

      case 7: // Pricing
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium mb-2">Base Price</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter base price"
            />
            <label className="block text-sm font-medium mb-2">Discounted Price</label>
            <input
              type="number"
              min="0"
              value={formData.discountPrice}
              onChange={(e) => handleInputChange('discountPrice', e.target.value)}
              disabled={!formData.discountEnabled}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              placeholder="Leave blank for no discount"
            />
            <label className="flex items-center justify-between gap-4 border rounded-lg px-3 py-2 bg-white cursor-pointer">
              <span className="font-semibold text-gray-900">Enable Discount</span>
              <input
                type="checkbox"
                checked={formData.discountEnabled}
                onChange={(e) => handleInputChange('discountEnabled', e.target.checked)}
                className="h-5 w-5 accent-orange-600"
              />
            </label>
            <div className="text-sm text-gray-600">
              <p>Advanced pricing by date can be configured in the database directly.</p>
              <p>Current date-specific prices:</p>
              <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-x-auto">
                {JSON.stringify(formData.datePrices, null, 2)}
              </pre>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (initialTourData && !initialTourData.name) return null; // Don't render if initialTourData is provided but empty
  if (!initialTourData && !(tour && isOpen)) return null; // For modal usage, only render if both tour and isOpen are provided

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center p-6 border-b">
        <h2 className="text-xl font-bold">Edit Tour: {formData.name}</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row h-full">
        {/* Step Navigation */}
        <div className="w-full md:w-48 bg-gray-50 p-4 border-r">
          <ul className="space-y-2">
            {steps.map((step, index) => (
              <li key={step.id}>
                <button
                  onClick={() => setCurrentStep(index)}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    currentStep === index
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  {step.title}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Step Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{steps[currentStep].title}</h3>
              <span className="text-sm text-gray-500">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
          </div>

          {renderStep()}
        </div>
      </div>

      {/* Footer with Navigation */}
      <div className="flex justify-between p-6 border-t bg-gray-50">
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
        </div>

        <div className="flex gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded-lg"
            >
              Cancel
            </button>
          )}
          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Tour'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TourEditWizard;
