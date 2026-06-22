import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Clock, Users, Star } from 'lucide-react';
import { normalizeTourData } from '../utils/tourDataMapper';
import { getTourCheckoutPath, getTourId, getTourSeoPath, matchesTourIdentifier } from '../utils/tourId';
import { apiUrl } from '../utils/api';
import TourReviews, { getTourReviewSummary } from '../components/TourReviews';
import { getDiscountPrice } from '../utils/bookingPricing';
import { useCurrency } from '../context/CurrencyContext';
import { getTourGalleryImages } from '../utils/tourImages';
import SEO from '../components/SEO';
import ApproxPriceNote from '../components/ApproxPriceNote';
import { fetchToursList } from '../services/toursApi';
import { absoluteUrl, createBreadcrumbJsonLd } from '../utils/seo';

const TourDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        let response = await fetch(apiUrl(`/api/tours/${id}`), {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (!response.ok) {
          const tours = await fetchToursList({ limit: 100 }, { skipCache: true });
          const matchedTour = tours.find((item) => matchesTourIdentifier(item, id));
          if (!matchedTour) {
            throw new Error('Tour not found');
          }
          const matchedTourId = getTourId(matchedTour);
          response = await fetch(apiUrl(`/api/tours/${matchedTourId}`), {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
          });
          if (!response.ok) {
            const normalizedMatchedTour = normalizeTourData(matchedTour);
            setTour(normalizedMatchedTour);
            return;
          }
        }
        if (!response.ok) {
          throw new Error('Tour not found');
        }
        const data = await response.json();
        const normalizedData = normalizeTourData(data);
        
        // Log for debugging data consistency
        console.log('TourDetails - Fetched Tour Data:', {
          id: normalizedData.id,
          name: normalizedData.name,
          price: normalizedData.price,
          duration: normalizedData.duration,
          highlightsCount: normalizedData.highlights?.length || 0,
          includedCount: normalizedData.included?.length || 0,
          excludedCount: normalizedData.excluded?.length || 0,
          itineraryCount: normalizedData.itinerary?.length || 0
        });
        
        setTour(normalizedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTour();
  }, [id]);

  useEffect(() => {
    // Check if tour is in favorites
    const userKey = 'guest'; // Simplified for this example
    const savedFavorites = localStorage.getItem(`favorites_${userKey}`);
    if (savedFavorites) {
      const favoritesList = JSON.parse(savedFavorites);
      const isInFavorites = favoritesList.some(fav => fav.id === id);
      setIsFavorite(isInFavorites);
    }
  }, [id]);

  const toggleFavorite = () => {
    const userKey = 'guest'; // Simplified for this example
    const savedFavorites = localStorage.getItem(`favorites_${userKey}`);
    let favoritesList = savedFavorites ? JSON.parse(savedFavorites) : [];

    const existingIndex = favoritesList.findIndex(fav => fav.id === id);
    
    if (existingIndex > -1) {
      // Remove from favorites
      favoritesList.splice(existingIndex, 1);
      setIsFavorite(false);
    } else {
      // Add to favorites
      if (tour) {
        favoritesList.push({
          id: getTourId(tour),
          title: tour.name,
          price: tour.price,
          description: tour.description,
          images: tour.images || [],
          address: tour.startLocation || tour.location || '',
        });
        setIsFavorite(true);
      }
    }

    localStorage.setItem(`favorites_${userKey}`, JSON.stringify(favoritesList));
  };

  const handleBooking = () => {
    if (tour) {
      navigate(getTourCheckoutPath(tour), { state: { tour } });
    }
  };

  const reviewSummary = getTourReviewSummary(tour);
  const reviewLabel = reviewSummary.reviewCount
    ? `${reviewSummary.reviewAverage.toFixed(1)} / 5`
    : 'No ratings yet';
  const discountPrice = getDiscountPrice(tour, tour?.price);
  const tourImages = getTourGalleryImages(tour);
  const tourName = tour ? (tour.name || tour.title || 'Private Switzerland Tour') : 'Private Switzerland Tour';
  const tourDescription = tour?.description || tour?.overview || `Book ${tourName} with AJL Tours for a private Switzerland travel experience.`;
  const tourPath = tour ? getTourSeoPath(tour) : `/tours/${id}`;
  const tourStructuredData = tour
    ? [
        createBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Tours', path: '/tours' },
          { name: tourName, path: tourPath },
        ]),
        {
          '@context': 'https://schema.org',
          '@type': 'TouristTrip',
          name: tourName,
          description: tourDescription,
          url: absoluteUrl(tourPath),
          image: tourImages.map((image) => absoluteUrl(image)),
          provider: {
            '@type': 'TravelAgency',
            name: 'AJL Tours',
            url: 'https://ajltour.com',
          },
          touristType: 'Private tour travelers',
          offers: {
            '@type': 'Offer',
            price: String(discountPrice ?? tour.price ?? ''),
            priceCurrency: tour.currency || 'CHF',
            availability: 'https://schema.org/InStock',
            url: absoluteUrl(tourPath),
          },
        },
      ]
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-semibold">Loading tour details...</div>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-red-600">Tour not found: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <SEO
        title={`${tourName} | Private Switzerland Tour | AJL Tours`}
        description={tourDescription.slice(0, 155)}
        image={tourImages[0] || '/logoTravel.png'}
        structuredData={tourStructuredData}
      />
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Tours
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tour Images */}
          <div className="space-y-4">
            {tourImages.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {tourImages.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${tourName} private Switzerland tour image ${index + 1}`}
                    className="w-full h-80 object-cover rounded-lg"
                  />
                ))}
              </div>
            ) : (
              <div className="bg-gray-200 h-80 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">No images available</span>
              </div>
            )}
          </div>

          {/* Tour Information */}
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{tourName}</h1>
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm text-gray-600">
                      {reviewLabel} ({reviewSummary.reviewCount} review{reviewSummary.reviewCount === 1 ? '' : 's'})
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={toggleFavorite}
                className={`p-2 rounded-full ${isFavorite ? 'text-red-500 bg-red-50' : 'text-gray-400 bg-gray-100'} hover:bg-opacity-100 transition-colors`}
              >
                <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Tour Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-gray-500 mr-2" />
                <span className="text-gray-600">{tour.startLocation || tour.location || 'Switzerland'}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-gray-500 mr-2" />
                <span className="text-gray-600">{tour.duration || 'Full Day'}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-5 h-5 text-gray-500 mr-2" />
                <span className="text-gray-600">{tour.maxGroupSize || '10'} Max Group</span>
              </div>
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-400 mr-2" />
                <span className="text-gray-600">{reviewLabel}</span>
              </div>
            </div>

            {/* Price */}
            <div className="border-t border-b py-4">
              <div className="text-3xl font-bold text-gray-900">
                {discountPrice !== null && (
                  <span className="mr-3 text-xl text-gray-400 line-through">{formatPrice(tour.price)}</span>
                )}
                {formatPrice(discountPrice ?? tour.price)}
                <span className="text-lg font-normal text-gray-600"> per person</span>
                <ApproxPriceNote />
              </div>
            </div>

            {/* Overview */}
            {tour.overview && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Overview</h2>
                <p className="text-gray-700 leading-relaxed">{tour.overview}</p>
              </div>
            )}

            {/* Description */}
            {tour.description && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700 leading-relaxed">{tour.description}</p>
              </div>
            )}

            {/* Highlights */}
            {tour.highlights && tour.highlights.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Highlights</h2>
                <ul className="space-y-2">
                  {tour.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span className="text-gray-700">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Booking Button */}
            <button
              onClick={handleBooking}
              className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Book Now
            </button>
          </div>
        </div>

        {/* Itinerary Section */}
        {tour.itinerary && tour.itinerary.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Itinerary</h2>
            <div className="space-y-6">
              {tour.itinerary.map((day, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Day {index + 1}: {day.title || `Day ${index + 1}`}
                  </h3>
                  {day.location && (
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{day.location}</span>
                    </div>
                  )}
                  <p className="text-gray-700">{day.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inclusions & Exclusions */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          {tour.included && tour.included.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What's Included</h2>
              <ul className="space-y-2">
                {tour.included.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tour.excluded && tour.excluded.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What's Not Included</h2>
              <ul className="space-y-2">
                {tour.excluded.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-500 mr-2">✗</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <TourReviews
          tour={tour}
          onTourUpdated={(updatedTour) => setTour(normalizeTourData(updatedTour))}
        />
      </div>
    </div>
  );
};

export default TourDetails;
