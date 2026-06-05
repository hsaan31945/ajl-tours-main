import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import { adminImageFormatMessage, isAllowedAdminImageFile } from "../utils/imageValidation";
import axios from "axios";
import { apiUrl } from "../utils/api";

const MAX_IMAGE_BYTES = 900 * 1024;
const MAX_TOTAL_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;

const dataUrlBytes = (dataUrl) => {
  const base64 = String(dataUrl || '').split(',')[1] || '';
  return Math.ceil((base64.length * 3) / 4);
};

const compressImageToWebp = (file) => new Promise((resolve, reject) => {
  const image = new Image();
  const objectUrl = URL.createObjectURL(file);

  image.onload = () => {
    URL.revokeObjectURL(objectUrl);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const tryQuality = (quality) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error(`Could not process ${file.name}`));
          return;
        }

        if (blob.size <= MAX_IMAGE_BYTES || quality <= 0.55) {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
          reader.readAsDataURL(blob);
          return;
        }

        tryQuality(quality - 0.12);
      }, 'image/webp', quality);
    };

    tryQuality(0.82);
  };

  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error(`Could not load ${file.name}`));
  };

  image.src = objectUrl;
});

const datePricesToRows = (datePrices) => {
  if (!datePrices) return [];
  if (Array.isArray(datePrices)) {
    return datePrices
      .map((entry) => ({
        date: entry?.date || '',
        price: Number(entry?.price || 0),
      }))
      .filter((entry) => entry.date);
  }
  if (typeof datePrices === 'object') {
    return Object.entries(datePrices)
      .map(([date, price]) => ({ date, price: Number(price || 0) }))
      .filter((entry) => entry.date);
  }
  return [];
};

const datePriceRowsToMap = (rows) => {
  if (!Array.isArray(rows)) return {};
  return rows.reduce((acc, entry) => {
    if (!entry?.date) return acc;
    const price = Number(entry.price);
    if (Number.isFinite(price)) {
      acc[entry.date] = price;
    }
    return acc;
  }, {});
};

const cleanTextArray = (items) => (
  Array.isArray(items)
    ? items.map((item) => String(item || '').trim()).filter(Boolean)
    : []
);

const cleanObjectArray = (items, keys) => (
  Array.isArray(items)
    ? items
        .map((item) => {
          const cleaned = {};
          keys.forEach((key) => {
            const value = String(item?.[key] || '').trim();
            if (value) cleaned[key] = value;
          });
          return cleaned;
        })
        .filter((item) => Object.keys(item).length > 0)
    : []
);

const TourWizard = () => {
  const navigate = useNavigate();
  const { tourId } = useParams(); // Get tour ID from URL params
  const [searchParams] = useSearchParams();
  const requestedDivision = searchParams.get("division") || "";
  const { isAdmin, passcodeHeader, getAuthHeader } = useAdmin();
  const [currentStep, setCurrentStep] = useState(1); // 1 = wizard, 2 = country selection
  const [isEditing, setIsEditing] = useState(!!tourId); // Check if we're editing an existing tour

  // Tour data state
  const [tourData, setTourData] = useState({
    // Basic info
    name: "",
    description: "",
    price: 0,
    discountEnabled: false,
    discountPrice: "",
    currency: "CHF",
    isActive: true,
    
    // Images
    images: [],
    imageFiles: [], // For file uploads
    
    // Blue bar info
    rating: "",
    reviews: "",
    topRated: false,
    
    // About this activity
    activities: [],
    
    // Itinerary
    itinerary: [],
    
    // What's included
    included: [],
    
    // Additional sections for editing
    overview: "",
    highlights: [],
    excluded: [],
    datePrices: [],
    
    // Location info
    startLocation: "",
    endLocation: "",
    startDate: "",
    endDate: "",
    
    // Booking constraints
    minTicketsPerBooking: 1,
    maxTotalTickets: null
  });
  
  // Load tour data if editing
  useEffect(() => {
    if (tourId) {
      const fetchTourData = async () => {
        try {
          const response = await fetch(apiUrl(`/api/tours/${tourId}`), {
            headers: {
              'X-Admin-Passcode': passcodeHeader || ''
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            
            // Normalize the tour data to include all sections
            const normalizedTourData = {
              ...data,
              name: data.name || data.title || "",
              description: data.description || data.desc || "",
              price: data.price || 0,
              discountEnabled: Boolean(data.discountEnabled),
              discountPrice: data.discountPrice ?? "",
              images: data.images || [],
              startLocation: data.startLocation || "",
              endLocation: data.endLocation || "",
              startDate: data.startDate || "",
              endDate: data.endDate || "",
              minTicketsPerBooking: data.minTicketsPerBooking || 1,
              maxTotalTickets: data.maxTotalTickets || null,
              // Load additional sections from metadata or direct fields
              overview: data.overview || data.metadata?.overview || "",
              highlights: data.highlights || data.metadata?.highlights || [],
              included: data.included || data.metadata?.included || [],
              excluded: data.excluded || data.metadata?.excluded || data.metadata?.notIncluded || [],
              itinerary: data.itinerary || data.metadata?.itinerary || [],
              activities: data.activities || data.metadata?.activities || [],
              datePrices: datePricesToRows(data.datePrices || data.metadata?.datePrices),
              rating: data.rating || data.metadata?.rating || "",
              reviews: data.reviews || data.metadata?.reviews || 0,
              topRated: data.topRated !== undefined ? data.topRated : Boolean(data.metadata?.topRated),
              currency: data.currency || data.metadata?.currency || "CHF",
              isActive: data.isActive !== undefined ? data.isActive : true
            };
            
            setTourData(normalizedTourData);
            // Set the division for editing
            if (data.division) {
              setSelectedDivision(data.division);
            }
          } else {
            console.error('Failed to fetch tour data');
            alert('Failed to load tour data');
          }
        } catch (error) {
          console.error('Error fetching tour data:', error);
        }
      };
      
      fetchTourData();
    }
  }, [tourId, passcodeHeader]);

  // Image upload handler. Admin uploads are restricted to WebP/AVIF and compressed before saving.
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const invalidFiles = files.filter((file) => !isAllowedAdminImageFile(file));
    if (invalidFiles.length > 0) {
      alert(`${adminImageFormatMessage}\n\nRejected: ${invalidFiles.map((file) => file.name).join(', ')}`);
      e.target.value = "";
      return;
    }
    Promise.all(files.map((file) => compressImageToWebp(file)))
      .then((base64Images) => {
        setTourData(prev => {
          const nextImages = [...prev.images, ...base64Images];
          const totalBytes = nextImages.reduce((sum, image) => sum + dataUrlBytes(image), 0);

          if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
            alert("Images are still too large after compression. Upload fewer images, or smaller WebP/AVIF files.");
            return prev;
          }

          return {
        ...prev,
            images: nextImages,
        imageFiles: [...prev.imageFiles, ...files]
          };
        });
      })
      .catch((error) => {
        alert(error.message || "Could not process image upload.");
      })
      .finally(() => {
        e.target.value = "";
      });
  };

  const removeImage = (index) => {
    setTourData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imageFiles: prev.imageFiles.filter((_, i) => i !== index)
    }));
  };

  // Activity management
  const addActivity = () => {
    setTourData(prev => ({
      ...prev,
      activities: [...prev.activities, { icon: "check", title: "", desc: "" }]
    }));
  };

  const removeActivity = (index) => {
    setTourData(prev => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index)
    }));
  };

  const updateActivity = (index, field, value) => {
    setTourData(prev => ({
      ...prev,
      activities: prev.activities.map((act, i) => 
        i === index ? { ...act, [field]: value } : act
      )
    }));
  };

  const moveActivity = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === tourData.activities.length - 1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    setTourData(prev => {
      const newActivities = [...prev.activities];
      [newActivities[index], newActivities[newIndex]] = [newActivities[newIndex], newActivities[index]];
      return { ...prev, activities: newActivities };
    });
  };

  // Itinerary management
  const addItineraryItem = () => {
    setTourData(prev => ({
      ...prev,
      itinerary: [...prev.itinerary, { location: "", type: "" }]
    }));
  };

  const removeItineraryItem = (index) => {
    setTourData(prev => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== index)
    }));
  };

  const updateItineraryItem = (index, field, value) => {
    setTourData(prev => ({
      ...prev,
      itinerary: prev.itinerary.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Included/Not included management
  const addIncluded = () => {
    setTourData(prev => ({
      ...prev,
      included: [...prev.included, ""]
    }));
  };

  const removeIncluded = (index) => {
    setTourData(prev => ({
      ...prev,
      included: prev.included.filter((_, i) => i !== index)
    }));
  };

  const updateIncluded = (index, value) => {
    setTourData(prev => ({
      ...prev,
      included: prev.included.map((item, i) => i === index ? value : item)
    }));
  };

  const addExcluded = () => {
    setTourData(prev => ({
      ...prev,
      excluded: [...prev.excluded, ""]
    }));
  };

  const removeExcluded = (index) => {
    setTourData(prev => ({
      ...prev,
      excluded: prev.excluded.filter((_, i) => i !== index)
    }));
  };

  const updateExcluded = (index, value) => {
    setTourData(prev => ({
      ...prev,
      excluded: prev.excluded.map((item, i) => i === index ? value : item)
    }));
  };

  // Handle form submission
  const handleSubmit = () => {
    // Validate required fields
    if (!tourData.name || !tourData.price || !tourData.startLocation || !tourData.endLocation) {
      alert("Please fill in all required fields: Name, Price, Start Location, End Location");
      return;
    }

    if (tourData.images.length === 0) {
      alert("Please upload at least one image");
      return;
    }

    // Move to country selection step
    setCurrentStep(2);
  };

  // Country selection and final save
  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState(tourData.division || requestedDivision || "");
  const [isAddingNewDivision, setIsAddingNewDivision] = useState(false);
  const [newDivisionName, setNewDivisionName] = useState("");
  const [isSubmittingNewDivision, setIsSubmittingNewDivision] = useState(false);

  useEffect(() => {
    // Fetch divisions
    const fetchDivisions = async () => {
      try {
        const res = await axios.get(apiUrl('/api/divisions'));
        if (res.data) {
          setDivisions(Array.isArray(res.data) ? res.data : []);
          // Auto-select Switzerland if it exists and no division is selected
          if (!selectedDivision) {
            const switzerland = res.data.find(d => d.name === "Switzerland");
            if (switzerland) {
              setSelectedDivision(switzerland._id || switzerland.id);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching divisions:', error);
        setDivisions([]);
      }
    };
    if (currentStep === 2) {
      fetchDivisions();
    }
  }, [currentStep, selectedDivision]);

  const handleCreateNewDivision = async () => {
    if (!newDivisionName.trim()) {
      alert("Please enter a country name");
      return;
    }

    setIsSubmittingNewDivision(true);
    try {
      const authHeaders = getAuthHeader ? getAuthHeader() : (passcodeHeader ? { 'X-Admin-Passcode': passcodeHeader } : {});
      const res = await axios.post(apiUrl('/api/divisions'), 
        { name: newDivisionName.trim(), description: `Tours in ${newDivisionName}` },
        { headers: authHeaders }
      );

      if (res.data) {
        const newDiv = res.data;
        setDivisions(prev => [...prev, newDiv]);
        setSelectedDivision(newDiv._id || newDiv.id);
        setIsAddingNewDivision(false);
        setNewDivisionName("");
        alert(`Country "${newDiv.name}" added successfully!`);
      }
    } catch (error) {
      console.error('Error creating country:', error);
      alert("Failed to create country: " + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmittingNewDivision(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!selectedDivision && !isEditing) {
      alert("Please select a country/division");
      return;
    }

    try {
      const totalImageBytes = tourData.images.reduce((sum, image) => sum + dataUrlBytes(image), 0);
      if (totalImageBytes > MAX_TOTAL_IMAGE_BYTES) {
        alert("Uploaded images are too large to save. Remove some images or upload smaller WebP/AVIF files.");
        return;
      }

      // Images are already compressed base64 data URLs from handleImageUpload
      const imageUrls = tourData.images;

      const finalStartDate = tourData.startDate ? new Date(tourData.startDate) : new Date();
      const finalEndDate = tourData.endDate ? new Date(tourData.endDate) : new Date(finalStartDate.getTime() + 24 * 60 * 60 * 1000);

      // Prepare tour data for API
      const normalizedDatePrices = datePriceRowsToMap(tourData.datePrices);

      const tourPayload = {
        division: isEditing ? tourData.division : selectedDivision,
        name: tourData.name,
        description: tourData.description,
        price: Number(tourData.price),
        discountEnabled: Boolean(tourData.discountEnabled),
        discountPrice: tourData.discountEnabled && tourData.discountPrice !== ""
          ? Number(tourData.discountPrice)
          : null,
        isActive: tourData.isActive !== false,
        startLocation: tourData.startLocation,
        endLocation: tourData.endLocation,
        startDate: finalStartDate,
        endDate: finalEndDate,
        images: imageUrls,
        minTicketsPerBooking: tourData.minTicketsPerBooking || 1,
        maxTotalTickets: tourData.maxTotalTickets || null,
        // Store additional sections
        overview: tourData.overview,
        highlights: cleanTextArray(tourData.highlights),
        included: cleanTextArray(tourData.included),
        excluded: cleanTextArray(tourData.excluded),
        itinerary: cleanObjectArray(tourData.itinerary, ['title', 'description', 'duration', 'location', 'type']),
        datePrices: normalizedDatePrices,
        metadata: {
          ...(tourData.rating !== "" && tourData.rating !== null && tourData.rating !== undefined ? { rating: Number(tourData.rating) } : {}),
          ...(tourData.reviews !== "" && tourData.reviews !== null && tourData.reviews !== undefined ? { reviews: Number(tourData.reviews) } : {}),
          ...(tourData.topRated !== undefined ? { topRated: Boolean(tourData.topRated) } : {}),
          activities: cleanObjectArray(tourData.activities, ['icon', 'title', 'desc']),
          itinerary: cleanObjectArray(tourData.itinerary, ['title', 'description', 'duration', 'location', 'type']),
          included: cleanTextArray(tourData.included),
          currency: tourData.currency,
          // Additional sections
          overview: tourData.overview,
          highlights: cleanTextArray(tourData.highlights),
          excluded: cleanTextArray(tourData.excluded),
          datePrices: normalizedDatePrices
        }
      };

      // Use JWT token if available, otherwise fallback to passcode
      const authHeaders = getAuthHeader ? getAuthHeader() : (passcodeHeader ? { 'X-Admin-Passcode': passcodeHeader } : {});
      const headers = { ...authHeaders, 'Content-Type': 'application/json' };
      
      if (isEditing && tourId) {
        // Update existing tour
        const res = await axios.put(apiUrl(`/api/tours/${tourId}`), tourPayload, { headers });
        if (res.data) {
          alert("Tour updated successfully!");
          navigate('/admin/tours');
        }
      } else {
        // Create new tour
        const res = await axios.post(apiUrl('/api/tours'), tourPayload, { headers });
        if (res.data) {
          alert("Tour created successfully!");
          navigate('/admin/dashboard');
        }
      }
    } catch (error) {
      console.error('Error saving tour:', error);
      // Dump everything to the alert so the user can send me the exact server response causing the 400
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
      alert("Failed to save tour: " + errorMsg + "\n\nServer Response: " + JSON.stringify(error.response?.data));

    }
  };

  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center text-2xl">Admin access required</div>;
  }

  // Step 2: Country Selection
  if (currentStep === 2) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">{isEditing ? 'Update' : 'Select'} Country/Division</h1>
          <p className="text-gray-600 mb-6">Choose which country this tour belongs to:</p>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Country/Division
              </label>
              {!isAddingNewDivision && (
                <button 
                  onClick={() => setIsAddingNewDivision(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
                >
                  + Add New Country
                </button>
              )}
            </div>

            {isAddingNewDivision ? (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <input
                  type="text"
                  value={newDivisionName}
                  onChange={(e) => setNewDivisionName(e.target.value)}
                  placeholder="Enter new country name"
                  className="w-full border rounded-lg px-4 py-2 mb-3"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateNewDivision}
                    disabled={isSubmittingNewDivision}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {isSubmittingNewDivision ? 'Saving...' : 'Save & Select'}
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingNewDivision(false);
                      setNewDivisionName("");
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-lg"
              >
                <option value="">Select a country...</option>
                {divisions.map((div) => (
                  <option key={div._id || div.id} value={div._id || div.id}>
                    {div.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-6 py-3 bg-gray-400 text-white rounded-lg font-bold hover:bg-gray-500"
            >
              Back
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={!selectedDivision && !isEditing}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isEditing ? 'Update Tour' : 'Add Tour'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Wizard Form
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-8 text-center">Create New Tour</h1>

        {/* Images Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Tour Images</h2>
          <div className="mb-4">
            <input
              type="file"
              accept="image/webp,image/avif,.webp,.avif"
              multiple
              onChange={handleImageUpload}
              className="mb-4"
              id="image-upload"
              style={{ display: 'none' }}
            />
            <label
              htmlFor="image-upload"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 cursor-pointer"
            >
              Upload Images
            </label>
            <p className="mt-2 text-sm text-gray-500">Only WebP or AVIF images are allowed.</p>
          </div>
          {tourData.images.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {tourData.images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img src={img} alt={`Tour ${idx + 1}`} className="w-full h-32 object-cover rounded-lg" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
              No images uploaded. Click "Upload Images" to add tour photos.
            </div>
          )}
        </div>

        {/* Basic Info Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tour Name *</label>
              <input
                type="text"
                value={tourData.name}
                onChange={(e) => setTourData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter tour name"
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
              <input
                type="number"
                value={tourData.price}
                onChange={(e) => setTourData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0"
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
              <label className="flex items-center justify-between gap-4 border rounded-lg px-4 py-2 bg-white cursor-pointer">
                <span>
                  <span className="block font-semibold text-gray-900">
                    {tourData.discountEnabled ? "Discount active" : "No discount"}
                  </span>
                  <span className="block text-xs text-gray-500">
                    Show original price crossed out to customers
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={tourData.discountEnabled}
                  onChange={(e) => setTourData(prev => ({
                    ...prev,
                    discountEnabled: e.target.checked,
                    discountPrice: e.target.checked ? prev.discountPrice : ""
                  }))}
                  className="h-5 w-5 accent-orange-600"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Discounted Price</label>
              <input
                type="number"
                min="0"
                value={tourData.discountPrice}
                onChange={(e) => setTourData(prev => ({
                  ...prev,
                  discountPrice: e.target.value,
                  discountEnabled: e.target.value !== ""
                }))}
                placeholder="Leave blank for no discount"
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Public Status</label>
              <label className="flex items-center justify-between gap-4 border rounded-lg px-4 py-2 bg-white cursor-pointer">
                <span>
                  <span className="block font-semibold text-gray-900">
                    {tourData.isActive !== false ? "Active" : "Draft"}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {tourData.isActive !== false ? "Visible to customers" : "Hidden from customers"}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={tourData.isActive !== false}
                  onChange={(e) => setTourData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-5 w-5 accent-orange-600"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Location *</label>
              <input
                type="text"
                value={tourData.startLocation}
                onChange={(e) => setTourData(prev => ({ ...prev, startLocation: e.target.value }))}
                placeholder="e.g., Zurich Main Station"
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Location *</label>
              <input
                type="text"
                value={tourData.endLocation}
                onChange={(e) => setTourData(prev => ({ ...prev, endLocation: e.target.value }))}
                placeholder="e.g., Zurich Main Station"
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={tourData.startDate}
                onChange={(e) => setTourData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={tourData.endDate}
                onChange={(e) => setTourData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full border rounded-lg px-4 py-2"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={tourData.description}
              onChange={(e) => setTourData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="Enter tour description..."
            />
          </div>
        </div>

        {/* About This Activity Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">About This Activity</h2>
          <div className="space-y-4">
            {tourData.activities.map((activity, idx) => (
              <div key={idx} className="border rounded-lg p-4 flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={activity.title}
                    onChange={(e) => updateActivity(idx, 'title', e.target.value)}
                    placeholder="Activity title"
                    className="w-full border rounded px-3 py-2 mb-2"
                  />
                  <textarea
                    value={activity.desc}
                    onChange={(e) => updateActivity(idx, 'desc', e.target.value)}
                    placeholder="Activity description"
                    rows={2}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => moveActivity(idx, 'up')} className="px-2 py-1 bg-gray-200 rounded">↑</button>
                  <button onClick={() => moveActivity(idx, 'down')} className="px-2 py-1 bg-gray-200 rounded">↓</button>
                  <button onClick={() => removeActivity(idx)} className="px-2 py-1 bg-red-200 rounded">×</button>
                </div>
              </div>
            ))}
            <button onClick={addActivity} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">
              + Add Activity
            </button>
          </div>
        </div>

        {/* Itinerary Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Itinerary</h2>
          <div className="space-y-4">
            {tourData.itinerary.map((item, idx) => (
              <div key={idx} className="border rounded-lg p-4 flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.location}
                    onChange={(e) => updateItineraryItem(idx, 'location', e.target.value)}
                    placeholder="Location name"
                    className="w-full border rounded px-3 py-2 mb-2"
                  />
                  <input
                    type="text"
                    value={item.type}
                    onChange={(e) => updateItineraryItem(idx, 'type', e.target.value)}
                    placeholder="Activity type"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <button onClick={() => removeItineraryItem(idx)} className="px-4 py-2 bg-red-200 rounded">×</button>
              </div>
            ))}
            <button onClick={addItineraryItem} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">
              + Add Itinerary Item
            </button>
          </div>
        </div>

        {/* What's Included / Not Included */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">What's Included</h2>
            <div className="space-y-2">
              {tourData.included.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateIncluded(idx, e.target.value)}
                    className="flex-1 border rounded px-3 py-2"
                  />
                  <button onClick={() => removeIncluded(idx)} className="px-3 py-2 bg-red-200 rounded">×</button>
                </div>
              ))}
              <button onClick={addIncluded} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">
                + Add Item
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">What's Not Included</h2>
            <div className="space-y-2">
              {tourData.excluded.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateExcluded(idx, e.target.value)}
                    className="flex-1 border rounded px-3 py-2"
                  />
                  <button onClick={() => removeExcluded(idx)} className="px-3 py-2 bg-red-200 rounded">×</button>
                </div>
              ))}
              <button onClick={addExcluded} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">
                + Add Item
              </button>
            </div>
          </div>
        </div>

        {/* Overview Section - New */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Overview</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tour Overview</label>
            <textarea
              value={tourData.overview}
              onChange={(e) => setTourData(prev => ({ ...prev, overview: e.target.value }))}
              rows={6}
              className="w-full border rounded-lg px-4 py-2"
              placeholder="Enter tour overview..."
            />
          </div>
        </div>

        {/* Highlights Section - New */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Highlights</h2>
          <div className="space-y-2">
            {tourData.highlights?.map((highlight, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={highlight}
                  onChange={(e) => {
                    const newHighlights = [...tourData.highlights];
                    newHighlights[idx] = e.target.value;
                    setTourData(prev => ({ ...prev, highlights: newHighlights }));
                  }}
                  placeholder="Enter highlight"
                  className="flex-1 border rounded-lg px-4 py-2"
                />
                <button
                  onClick={() => {
                    const newHighlights = tourData.highlights.filter((_, i) => i !== idx);
                    setTourData(prev => ({ ...prev, highlights: newHighlights }));
                  }}
                  className="px-3 py-2 bg-red-200 rounded-lg hover:bg-red-300"
                >
                  ×
                </button>
              </div>
            )) || <p className="text-gray-500">No highlights yet</p>}
            <button
              onClick={() => setTourData(prev => ({
                ...prev,
                highlights: [...(prev.highlights || []), ""]
              }))}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
            >
              + Add Highlight
            </button>
          </div>
        </div>



        {/* What's Included / Not Included */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">What's Included</h2>
            <div className="space-y-2">
              {tourData.included.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newIncluded = [...tourData.included];
                      newIncluded[idx] = e.target.value;
                      setTourData(prev => ({ ...prev, included: newIncluded }));
                    }}
                    className="flex-1 border rounded px-3 py-2"
                  />
                  <button onClick={() => {
                    const newIncluded = tourData.included.filter((_, i) => i !== idx);
                    setTourData(prev => ({ ...prev, included: newIncluded }));
                  }} className="px-3 py-2 bg-red-200 rounded">×</button>
                </div>
              ))}
              <button onClick={() => setTourData(prev => ({
                ...prev,
                included: [...prev.included, ""]
              }))} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">
                + Add Item
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">What's Not Included</h2>
            <div className="space-y-2">
              {tourData.excluded.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newExcluded = [...tourData.excluded];
                      newExcluded[idx] = e.target.value;
                      setTourData(prev => ({ ...prev, excluded: newExcluded }));
                    }}
                    className="flex-1 border rounded px-3 py-2"
                  />
                  <button onClick={() => {
                    const newExcluded = tourData.excluded.filter((_, i) => i !== idx);
                    setTourData(prev => ({ ...prev, excluded: newExcluded }));
                  }} className="px-3 py-2 bg-red-200 rounded">×</button>
                </div>
              ))}
              <button onClick={() => setTourData(prev => ({
                ...prev,
                excluded: [...prev.excluded, ""]
              }))} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700">
                + Add Item
              </button>
            </div>
          </div>
        </div>

        {/* Date Prices Section - New */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Date Prices</h2>
          <p className="text-gray-600 mb-4">Manage special pricing for specific dates</p>
          <div className="space-y-4">
            {tourData.datePrices?.map((datePrice, idx) => (
              <div key={idx} className="border rounded-lg p-4 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={datePrice.date || ''}
                    onChange={(e) => {
                      const newDatePrices = [...tourData.datePrices];
                      newDatePrices[idx].date = e.target.value;
                      setTourData(prev => ({ ...prev, datePrices: newDatePrices }));
                    }}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    value={datePrice.price || ''}
                    onChange={(e) => {
                      const newDatePrices = [...tourData.datePrices];
                      newDatePrices[idx].price = parseFloat(e.target.value);
                      setTourData(prev => ({ ...prev, datePrices: newDatePrices }));
                    }}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      const newDatePrices = tourData.datePrices.filter((_, i) => i !== idx);
                      setTourData(prev => ({ ...prev, datePrices: newDatePrices }));
                    }}
                    className="px-3 py-2 bg-red-200 rounded-lg hover:bg-red-300"
                  >
                    ×
                  </button>
                </div>
              </div>
            )) || <p className="text-gray-500">No date-specific prices yet</p>}
            <button
              onClick={() => {
                const newDatePrice = {
                  date: new Date().toISOString().split('T')[0],
                  price: tourData.price
                };
                setTourData(prev => ({
                  ...prev,
                  datePrices: [...(prev.datePrices || []), newDatePrice]
                }));
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
            >
              + Add Date Price
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleSubmit}
            className="px-8 py-4 bg-orange-600 text-white rounded-lg font-bold text-lg hover:bg-orange-700"
          >
            {isEditing ? 'Update Tour' : 'Submit Tour'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TourWizard;
