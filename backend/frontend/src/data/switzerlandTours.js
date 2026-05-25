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
// Import Interlaken and Grindelwald images
import interlaken1 from "../assets/images/Interlaken_and_Grindelwald/Interlaken1.avif";
import interlaken2 from "../assets/images/Interlaken_and_Grindelwald/Interlaken2.avif";
import interlaken3 from "../assets/images/Interlaken_and_Grindelwald/Interlaken3.avif";
import interlaken4 from "../assets/images/Interlaken_and_Grindelwald/Interlaken4.avif";
import interlaken5 from "../assets/images/Interlaken_and_Grindelwald/Interlaken5.avif";
import interlaken6 from "../assets/images/Interlaken_and_Grindelwald/Interlaken6.avif";
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

export const switzerlandTours = [
  {
    id: "01",
    name: "4 Country Tours",
    images: [zurich1, zurich3, zurich4, zurich5, zurich6, zurich7, zurich8, zurich9, zurich10, zurich12],
    price: 15000,
    address: "Zurich Main Station, Zurich, Switzerland",
    features: [
      "Meersburg Castle Visit",
      "Lindau Island Tour",
      "Bregenz Lake Promenade",
      "Vaduz Castle Viewpoint",
      "Multilingual Guide"
    ]
  },
  {
    id: "02",
    name: "Grindelwald Tours",
    images: [interlaken1, interlaken2, interlaken3, interlaken4, interlaken5, interlaken6],
    price: 12000,
    address: "Grindelwald Terminal, Grindelwald, Switzerland",
    features: [
      "Alpine Train Ride",
      "Mountain Hikes",
      "Village Walks",
      "Cable Car Experience",
      "Local Cuisine Tasting"
    ]
  },
  {
    id: "03",
    name: "Crashlanding Tours",
    images: [crashLanding1, crashLanding2, crashLanding3, crashLanding4, crashLanding5, crashLanding6, crashLanding7, crashLanding8, crashLanding9, crashLanding10, crashLanding11, crashLanding12],
    price: 11000,
    address: "Iseltwald Pier, Iseltwald, Switzerland",
    features: [
      "Iseltwald Photo Stop",
      "Sigriswil Panorama Bridge",
      "Interlaken Adventure Sports",
      "Lake Brienz Cruise",
      "Filming Location Tour"
    ]
  },
  {
    id: "04",
    name: "Lauterbrunnen & Interlaken",
    images: [interlaken1, interlaken2, interlaken3, interlaken4, interlaken5, interlaken6],
    price: 10000,
    address: "Lauterbrunnen Station, Lauterbrunnen, Switzerland",
    features: [
      "Staubbach Falls Visit",
      "Valley Walks",
      "Paragliding Experience",
      "Interlaken Lake Views",
      "Adventure Sports"
    ]
  },
  {
    id: "08",
    name: "From Zurich: Private St. Gallen and Appenzell Day Tour",
    images: [Appenzell1, Appenzell2, Appenzell3, Appenzell4, Appenzell5, Appenzell6],
    price: 29700,
    address: "Zurich Main Station, Zurich, Switzerland",
    features: [
      "UNESCO-listed Abbey Library in St. Gallen",
      "Appenzell's charming old town",
      "Authentic Swiss cuisine and local specialties",
      "Optional visit to Appenzeller Brewery",
      "Scenic drives through Swiss countryside",
      "Private transportation and expert guide"
    ],
    desc: "Experience a private day tour from Zurich to St. Gallen's Abbey Library and Appenzell's charming old town. Discover Swiss culture and stunning landscapes in one unforgettable day.",
    rating: 4.5,
    reviews: 2,
    duration: "10 hours",
    provider: "Ajl Tours",
    highlights: [
      "Visiting the UNESCO-listed Abbey Library in St. Gallen",
      "Enjoying authentic Swiss cuisine and local specialties",
      "Optional visit to the Appenzeller Brewery",
      "Scenic drives through the Swiss countryside",
      "Wander through the picturesque old town of Appenzell"
    ],
    itinerary: [
      "Starting location: Zurich",
      "Appenzell - Visit, Guided tour, Free time",
      "Vaduz - Photo stop, Visit, Guided tour, Free time, Sightseeing",
      "Bregenz - Photo stop, Visit, Guided tour, Free time, Sightseeing",
      "Return to Zurich"
    ]
  },
  {
    id: "09",
    name: "Zurich to Rhine Falls: Unforgettable Private Day Trip",
    images: [rhine1, rhine2, rhine3, rhine4],
    price: 173,
    address: "Zurich Main Station, Zurich, Switzerland",
    features: [
      "Rhine Falls visit with guided tour",
      "Stein am Rhein exploration",
      "Scenic Swiss countryside drive",
      "Long-tail boat ride option",
      "Professional English/German guide",
      "Hotel pickup and drop-off"
    ],
    desc: "Discover the power of Rhine Falls on a scenic day trip from Zurich. Enjoy breathtaking views, feel the mist on your face, and create lasting memories in the heart of the Swiss countryside.",
    rating: 4.7,
    reviews: 3,
    duration: "5 hours",
    provider: "Ajl Tours",
    highlights: [
      "Get close to Europe's largest waterfall with stunning views and refreshing mist",
      "Enjoy a scenic drive through picturesque Swiss landscapes with expert commentary",
      "Enjoy ample time to explore and take in the natural beauty at your own pace",
      "Get close to the falls with unique viewing platforms",
      "Witness the spectacular power of Rhine Falls, Europe's largest waterfall"
    ],
    itinerary: [
      "Pickup from Zurich accommodation",
      "Rhine Falls - Visit, Guided tour, Free time, Sightseeing, Long-tail boat ride",
      "Stein am Rhein - Photo stop, Visit, Sightseeing",
      "Return to Zurich"
    ]
  },
  {
    id: "10",
    name: "Zurich: Titlis Engelberg and Luzern Full-Day Private Tour",
    images: [titlis1, titlis2, titlis3, titlis4, titlis5],
    price: 272,
    address: "Zurich Main Station, Zurich, Switzerland",
    features: [
      "Titlis Cliff Walk experience",
      "Engelberg village exploration",
      "Lucerne Old Town guided tour",
      "Chapel Bridge and Water Tower visit",
      "Panoramic cable car ride",
      "Private transportation and guide"
    ],
    desc: "Discover Lucerne's historic charm and Engelberg's alpine beauty on a full-day tour from Zurich. Take a guided walking tour of Lucerne's Old Town and enjoy mountain vistas in Engelberg.",
    rating: 5.0,
    reviews: 1,
    duration: "10 hours",
    provider: "Ajl Tours",
    highlights: [
      "Become immersed in Switzerland's nature and culture on a full-day tour",
      "Explore Lucerne's medieval cobblestone streets on a guided walking tour",
      "Admire Lucerne's highlights, including Chapel Bridge and the Water Tower",
      "Get free time to explore the picturesque village of Engelberg at your leisure",
      "Ride the panoramic cable car to Mount Titlis to tackle the Titlis Cliff Walk"
    ],
    itinerary: [
      "Pickup from Zurich accommodation",
      "Car - Scenic drive (1 hour)",
      "Titlis Cliff Walk - Visit, Free time, Sightseeing, Walk, Scenic views on the way",
      "Engelberg - Break time, Photo stop, Visit, Guided tour, Free time, Sightseeing, Scenic views on the way",
      "Lucerne - Visit, Free time, Sightseeing, Scenic views on the way",
      "Return to Zurich"
    ]
  },
  {
    id: "11",
    name: "From Zurich Full-day private tour Basel and Colmar",
    images: [basel1, basel2, basel3, basel4],
    price: 334,
    address: "Zurich Main Station, Zurich, Switzerland",
    features: [
      "Basel Minster visit",
      "Kunstmuseum Basel art collection",
      "Colmar's picturesque streets",
      "Haut-Kœnigsbourg Castle",
      "Unterlinden Museum in Colmar",
      "Personalized itinerary and expert guide"
    ],
    desc: "Discover Basel's rich history and Colmar's charming streets on a full-day private tour from Zurich. Tailor your journey with personalized insights and explore at your own pace.",
    rating: 4.5,
    reviews: 0,
    duration: "10 hours",
    provider: "Ajl Tours",
    highlights: [
      "Discover the Gothic splendor of Basel Minster and the medieval charm of its Old Town",
      "Explore one of Europe's finest art collections spanning from the Renaissance",
      "Wander through Colmar's picturesque streets lined with colorful half-timbered houses",
      "Marvel at the famous Isenheim Altarpiece and other Alsatian art treasures",
      "Enjoy a tailored itinerary with expert guidance and the flexibility to explore"
    ],
    itinerary: [
      "Pickup from Zurich",
      "Colmar - Photo stop, Visit, Guided tour, Free time",
      "Haut-Kœnigsbourg Castle - Photo stop, Visit, Guided tour, Free time",
      "Basel - Photo stop, Visit, Guided tour, Free time",
      "Return to Zurich"
    ]
  },
  {
    id: "12",
    name: "From Zurich: Interlaken and Grindelwald Private Day Tour",
    images: [interlaken1, interlaken2, interlaken3, interlaken4, interlaken5, interlaken6],
    price: 247,
    address: "Zurich Main Station, Zurich, Switzerland",
    features: [
      "Interlaken town exploration",
      "Grindelwald village visit",
      "Lauterbrunnen valley views",
      "Alpine landscape photography",
      "Personalized itinerary",
      "Expert local guide and transportation"
    ],
    desc: "Discover Zurich, Interlaken, and Grindelwald on a private day tour from Zurich. Experience Swiss beauty, from lakeside vistas to alpine peaks.",
    rating: 5.0,
    reviews: 4,
    duration: "10 hours",
    provider: "Ajl Tours",
    highlights: [
      "Interlaken Exploration: Discover the picturesque town situated between Lake Thun and Lake Brienz",
      "Flexible Itinerary: Enjoy the flexibility to customize your experience",
      "Outdoor Adventures: Depending on the season, engage in thrilling activities",
      "Alpine Views: Experience panoramic views of the Swiss Alps",
      "Cultural Experience: Immerse yourself in Swiss traditions and local life"
    ],
    itinerary: [
      "Pickup from Zurich accommodation",
      "Grindelwald - Photo stop, Visit, Guided tour, Free time",
      "Lauterbrunnen - Photo stop, Visit, Guided tour, Free time",
      "Interlaken - Photo stop, Visit, Guided tour, Free time",
      "Return to Zurich"
    ]
  }
];

// Helper function to normalize Swiss tour IDs (handles both "7" and "07")
export const normalizeSwissId = (id) => {
  if (!id) return null;
  const strId = String(id);
  // If it's a single digit, pad with zero
  if (strId.length === 1) {
    return strId.padStart(2, '0');
  }
  return strId;
};

export default switzerlandTours;

