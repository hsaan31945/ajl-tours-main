const initData = {
  name: "AI Test Tour 1",
  description: "Enter tour description here... 1",
  price: 150,
  currency: "USD1",
  rating: 4.9,
  reviews: 0,
  topRated: true,
  activities: [
    { icon: "check", title: "Free cancellation 1", desc: "Cancel up to 24 hours in advance for a full refund 1" },
    { icon: "user", title: "Reserve now & pay later 1", desc: "Keep your travel plans flexible — book your spot and pay nothing today. 1" },
  ],
  itinerary: [
    { location: "Zürich 1", type: "Pickup location 1" },
    { location: "Rhine Falls 1", type: "Visit, Sightseeing, Scenic drive 1" },
  ],
  included: [
    "Professional tour guide 1",
    "Transportation 1",
  ],
  notIncluded: [
    "Meals and drinks 1",
    "Personal expenses 1",
  ],
  overview: "1",
  highlights: ["1"],
  excluded: ["1"],
  datePrices: [],
  startLocation: "Zurich 1",
  endLocation: "Zurich 1",
  startDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], // 7 days from now
  endDate: new Date(Date.now() + 86400000 * 8).toISOString().split('T')[0], // 8 days from now
  minTicketsPerBooking: 1,
  maxTotalTickets: null,
  images: ["data:image/jpeg;base64,...1"]
};

// Map to payload just like TourWizard.jsx
const tourPayload = {
  division: "67718e80556da028de1fb050", // Switzerland ID (will fetch dynamically)
  name: initData.name,
  description: initData.description,
  price: Number(initData.price),
  startLocation: initData.startLocation,
  endLocation: initData.endLocation,
  startDate: new Date(initData.startDate),
  endDate: new Date(initData.endDate),
  images: initData.images,
  minTicketsPerBooking: initData.minTicketsPerBooking || 1,
  maxTotalTickets: initData.maxTotalTickets || null,
  overview: initData.overview,
  highlights: initData.highlights,
  included: initData.included,
  excluded: initData.excluded,
  itinerary: initData.itinerary,
  datePrices: initData.datePrices,
  metadata: {
    rating: initData.rating,
    reviews: initData.reviews,
    topRated: initData.topRated,
    activities: initData.activities,
    itinerary: initData.itinerary,
    included: initData.included,
    notIncluded: initData.notIncluded,
    currency: initData.currency,
    overview: initData.overview,
    highlights: initData.highlights,
    excluded: initData.excluded,
    datePrices: initData.datePrices
  }
};

(async () => {
  try {
    // 1. Fetch Switzerland division ID
    const divs = await fetch('https://ajl-tours-frontend.vercel.app/api/divisions').then(r => r.json());
    const switz = divs.find(d => d.name === "Switzerland");
    if (switz) tourPayload.division = switz.id;

    // 2. Post Tour
    const res = await fetch('https://ajl-tours-frontend.vercel.app/api/tours', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Passcode': 'admin123'
      },
      body: JSON.stringify(tourPayload)
    });
    
    if (!res.ok) {
      const text = await res.text();
      console.error(`HTTP ${res.status}:`, text);
    } else {
      console.log("Success!", await res.json());
    }
  } catch (err) {
    console.error("Fetch err:", err);
  }
})();
