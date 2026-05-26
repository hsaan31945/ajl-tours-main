import React, { Suspense, lazy, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AdminControlPanel from "../components/AdminControlPanel";
import { useAdmin } from "../context/AdminContext";
import SEO from "../components/SEO";
import { Search, MapPin, Compass, Users, ChevronDown, CheckCircle, Star, Quote, Car, Map, Clock, ShieldCheck, HeartPulse } from "lucide-react";
import hero4 from "../assets/images/optimized/hero4-1600.webp";
import hero5 from "../assets/images/optimized/hero5-1600.webp";
import hero6 from "../assets/images/optimized/hero6-1600.webp";
import hero7 from "../assets/images/optimized/hero7-1600.webp";
import hero4Small from "../assets/images/optimized/hero4-900.webp";
import hero5Small from "../assets/images/optimized/hero5-900.webp";
import hero6Small from "../assets/images/optimized/hero6-900.webp";
import hero7Small from "../assets/images/optimized/hero7-900.webp";

const ExploreTours = lazy(() => import("../components/ExploreTours"));
const TopDealsSection = lazy(() => import("../components/TopDealsSection"));

const DeferredSection = ({ children, rootMargin = "700px" }) => {
  const ref = useRef(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (shouldRender) return;

    const node = ref.current;
    if (!node) return;

    if (!("IntersectionObserver" in window)) {
      const timeout = window.setTimeout(() => setShouldRender(true), 1000);
      return () => window.clearTimeout(timeout);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, shouldRender]);

  return <div ref={ref}>{shouldRender ? children : null}</div>;
};

const Home2 = () => {
  const navigate = useNavigate();
  const { passcodeHeader, isAdmin } = useAdmin();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [homepageContent, setHomepageContent] = useState({});

  // Load homepage content on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/content/homepage');
        const data = await res.json();
        if (res.ok) {
          const contentMap = {};
          data.forEach(item => {
            contentMap[item.section] = item.content;
          });
          setHomepageContent(contentMap);
        }
      } catch (e) {}
    })();
  }, []);

  const updateSection = async (section, content) => {
    try {
      const res = await fetch(`/api/admin/content/${section}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': passcodeHeader || ''
        },
        body: JSON.stringify({ content })
      });
      if (!res.ok) return false;
      setHomepageContent(prev => ({ ...prev, [section]: content }));
      return true;
    } catch (e) {
      return false;
    }
  };



  // Handle saving tour descriptions
  const handleSaveTourDescription = async (tourKey, newDescription) => {
    const current = homepageContent.tour_descriptions || {};
    const updated = {
      ...current,
      [tourKey]: {
        ...current[tourKey],
        description: newDescription
      }
    };
    return await updateSection('tour_descriptions', updated);
  };

  const handleSaveTourTitle = async (tourKey, newTitle) => {
    const current = homepageContent.tour_descriptions || {};
    const updated = {
      ...current,
      [tourKey]: {
        ...current[tourKey],
        title: newTitle
      }
    };
    return await updateSection('tour_descriptions', updated);
  };

  // Hero carousel images
  const heroImages = [
    hero4,
    hero5, 
    hero6,
    hero7
  ];

  const heroGridImages = [
    { src: hero4Small, alt: "Swiss mountain village" },
    { src: hero7Small, alt: "Swiss alpine landscape" },
    { src: hero5Small, alt: "Swiss scenic valley" },
    { src: hero6Small, alt: "Switzerland Alps" },
  ];

  // Search data
  const searchData = [
    { name: "Switzerland", type: "destination", route: "/switzerland" },
    { name: "Alps Tour", type: "tour", route: "/switzerland" },
    { name: "Lake Geneva", type: "tour", route: "/switzerland" },
    { name: "Swiss Train", type: "tour", route: "/switzerland" },
  ];

  // Search function
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const filtered = searchData.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
    setShowDropdown(true);
  };

  // Handle search result click
  const handleSearchResultClick = (result) => {
    setSearchQuery(result.name);
    setShowDropdown(false);
    navigate(result.route);
  };

  // Handle search button click
  const handleSearchButtonClick = () => {
    if (searchQuery.trim() !== "") {
      const result = searchData.find(item =>
        item.name.toLowerCase() === searchQuery.toLowerCase()
      );
      if (result) {
        navigate(result.route);
      }
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-advance carousel every 6 seconds with smooth sliding transition
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 6000);

    return () => clearInterval(interval);
  }, [heroImages.length]);

  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen">
      <SEO
        title="AJL Tours | Private Switzerland Tours"
        description="Book premium private Switzerland tours with AJL Tours, including luxury vehicles, flexible itineraries, local guides, and seamless pickup."
      />
      {/* Admin Control Panel */}
      <AdminControlPanel />


      {/* Hero Section - Full Width Background */}
      <section className="relative h-[70vh] sm:h-[60vh] md:h-screen w-full overflow-hidden bg-gray-900">
        {/* Mobile Background: Static with Overlay */}
        <div className="md:hidden absolute inset-0 z-0">
          <img
            src={hero6Small}
            srcSet={`${hero6Small} 900w, ${hero6} 1600w`}
            sizes="100vw"
            alt=""
            width="900"
            height="600"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        {/* Desktop Background: Carousel with Overlay */}
        <div className="hidden md:block absolute inset-0 z-0">
          <div 
            className="flex h-full transition-transform duration-1000 ease-in-out" 
            style={{ 
              width: `${heroImages.length * 100}%`,
              transform: `translateX(-${(currentImageIndex / heroImages.length) * 100}%)`
            }}
          >
            {heroImages.map((image, index) => (
              <div
                key={index}
                className="relative h-full overflow-hidden"
                style={{ 
                  width: `${100 / heroImages.length}%`
                }}
              >
                <img
                  src={image}
                  alt=""
                  width="1600"
                  height="1067"
                  fetchPriority={index === 0 ? "high" : "auto"}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        {/* Hero Content */}
        <div className="absolute inset-0 z-20 flex items-center h-full">
          <div className="text-white ml-4 sm:ml-8 md:ml-16 lg:ml-24 px-4 sm:px-0 w-full max-w-4xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 drop-shadow-2xl leading-tight">
              The Top Choice for Private & <span className="text-orange-500">Premium Tours</span> in Switzerland
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-white/95 mb-10 max-w-2xl font-medium leading-relaxed drop-shadow-lg">
              Enjoy a Seamless Experience with Personalised Tours, Private Tour Guides and Luxury Vehicles
            </p>

            {/* Search Destination Bar */}
            <div className="w-full md:max-w-[700px] relative search-container">
              <div className="flex items-center backdrop-blur-md rounded-full shadow-2xl px-3 sm:px-4 py-2 sm:py-4 transition-all duration-300 focus-within:ring-4 focus-within:ring-orange-500/30" style={{ backgroundColor: 'rgb(255 255 255 / 0.98)' }}>
                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 mr-2 sm:mr-3 shrink-0" />
                <input
                  type="text"
                  className="flex-1 bg-transparent outline-none text-sm sm:text-lg text-black placeholder-gray-500 min-w-0"
                  placeholder="Find places and things to do"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchQuery.trim() !== "" && setShowDropdown(true)}
                  autoComplete="off"
                />
                <button 
                  className="bg-orange-600 hover:bg-black text-white font-bold px-4 sm:px-10 py-2 sm:py-4 rounded-full transition-all duration-300 text-sm sm:text-lg whitespace-nowrap flex-shrink-0 shadow-lg ml-1"
                  onClick={handleSearchButtonClick}
                >
                  Search
                </button>
              </div>
              
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-80 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="px-6 py-4 hover:bg-orange-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors"
                        onClick={() => handleSearchResultClick(result)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-orange-500" />
                            <div>
                              <div className="font-bold text-gray-900">{result.name}</div>
                              <div className="text-xs text-gray-500 uppercase tracking-wider">{result.type}</div>
                            </div>
                          </div>
                          <ChevronDown className="w-4 h-4 text-gray-300 -rotate-90" />
                        </div>
                      </div>
                    ))
                  ) : searchQuery.trim() !== "" ? (
                    <div className="px-6 py-6 text-gray-500 text-center font-medium">
                      No matches found
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-24 px-6 sm:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1A2B47] mb-8 leading-tight">
                Experience Switzerland, <span className="text-orange-600 italic">Privately and Seamlessly</span>
              </h2>
              <div className="space-y-6 text-lg text-gray-700 leading-relaxed font-medium">
                <p>
                  Discover Switzerland the way you want to, from carefully tailored itineraries 
                  to the breathtaking alpines located within the heart of Switzerland, every tour 
                  is expertly guided, seamlessly planned and tailored to the clients personal 
                  interests to create truly unforgettable and exceptional memories.
                </p>
                <div className="bg-orange-50 p-8 rounded-3xl border-l-8 border-orange-500 shadow-sm relative overflow-hidden">
                  <Quote className="absolute top-4 right-4 w-12 h-12 text-orange-200" />
                  <p className="text-2xl font-bold text-[#1A2B47] italic mb-4 relative z-10 font-serif">
                    “We always return with renewed delight to the magnificent mountains.”
                  </p>
                  <p className="text-orange-600 font-bold uppercase tracking-widest text-sm">— Johann Wolfgang Von Goethe</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl">
                <img
                  src={hero6Small}
                  alt="Switzerland Alps"
                  width="900"
                  height="600"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-1000"
                />
              </div>
              <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-3xl shadow-xl border border-gray-100 hidden sm:block">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-600 p-3 rounded-2xl">
                    <Star className="text-white w-8 h-8 fill-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-black">100%</div>
                    <div className="text-sm text-gray-500 font-bold uppercase tracking-wider">Premium Experience</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Explore Tours Section */}
      <DeferredSection>
        <Suspense fallback={null}>
          <ExploreTours />
        </Suspense>
      </DeferredSection>

      {/* Top Deals Section */}
      <DeferredSection>
        <Suspense fallback={null}>
          <TopDealsSection />
        </Suspense>
      </DeferredSection>

      {/* Services Section */}
      <section className="py-24 px-6 sm:px-12 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h4 className="text-orange-600 font-bold uppercase tracking-[0.3em] mb-4">Exclusive Experience</h4>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1A2B47]">Services that we offer</h2>
          </div>
          
          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 sm:mx-0 sm:px-0">
            <div className="min-w-[85%] md:min-w-0 snap-center">
              <ServiceCard 
                icon={<Compass />}
                title="Customisable itinerary"
                description="We provide Ultimate Freedom based on your interests with flexibility to stop wherever and whenever you want as we bridge the gap between global luxury and local culture while offering insights into the hidden gems of Switzerland."
              />
            </div>
            <div className="min-w-[85%] md:min-w-0 snap-center">
              <ServiceCard 
                icon={<Users />}
                title="Personalised small and private group tours"
                description="Whether travelling with a small group or on a private journey, whether you seek a scenic road trip or a bespoke mountain tour, you remain in full control of your itinerary and the destinations you explore across Switzerland."
              />
            </div>
            <div className="min-w-[85%] md:min-w-0 snap-center">
              <ServiceCard 
                icon={<Car />}
                title="High end vehicles at your service"
                description="From high-end sedans to chauffeured SUVs, we offer a full range of premium and luxury transportation, tailored to your group size and needs. Each car is meticulously maintained for safety and comfort."
              />
            </div>
            <div className="min-w-[85%] md:min-w-0 snap-center">
              <ServiceCard 
                icon={<ShieldCheck />}
                title="Team of Experienced chauffeurs"
                description="Your high-end vehicle is driven by our dedicated and experienced chauffeurs, providing timely and professional service with trusted local knowledge and a commitment to excellence."
              />
            </div>
            <div className="min-w-[85%] md:min-w-0 snap-center">
              <ServiceCard 
                icon={<Map />}
                title="Expert local and tour guides"
                description="Our expert local tour guides share genuine knowledge and cultural insight, creating personalised experiences that make every destination meaningful and memorable."
              />
            </div>
            <div className="min-w-[85%] md:min-w-0 snap-center">
              <ServiceCard 
                icon={<Clock />}
                title="Transfers and VIP Pickup"
                description="Enjoy easy and seamless travel from arrival to departure. Carefully planned routes ensure a zero-hassle experience, creating memories that last a lifetime."
              />
            </div>
            <div className="min-w-[85%] md:min-w-0 snap-center">
              <ServiceCard 
                icon={<HeartPulse />}
                title="Seasonal and special tours"
                description="From festive holiday experiences to exclusive Alpine getaways, discover Christmas markets, winter celebrations, and scenic mountain escapes with personalised service."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="py-24 px-6 sm:px-12 bg-[#1A2B47] text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
            <div>
              <h2 className="text-4xl font-extrabold mb-8 text-orange-500 whitespace-nowrap">Who We Are</h2>
              <p className="text-lg text-gray-300 leading-relaxed font-medium">
                At AJL Tours, we believe that travel is more than just seeing places, it’s about 
                creating moments that stay with you forever. Based in Switzerland, we design 
                tailored private and small‑group tours that showcase the country’s most 
                beautiful landscapes, rich culture and hidden gems. Every itinerary is 
                personalised to your interests and pace, whether you’re exploring alpine 
                villages, iconic cities or scenic mountain roads.
              </p>
            </div>
            <div>
              <h2 className="text-4xl font-extrabold mb-8 text-orange-500 whitespace-nowrap">Our Mission</h2>
              <p className="text-lg text-gray-300 leading-relaxed font-medium">
                At AJL Tours, our main mission is to redefine travel in Switzerland through our 
                premium services. We are dedicated to providing private and small-group based 
                journeys that are crafted around our clients' own unique vision, combining 
                all the necessary ingredients of an amazing trip into one. Our purpose is simple; 
                we value the highest standard of personalised travelling experience.
              </p>
            </div>
          </div>
        </div>
      </section>





      

      {/* Why Choose Us Section */}
      <section className="py-24 px-6 sm:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="lg:w-1/2 order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="aspect-square rounded-3xl overflow-hidden shadow-lg"><img src={heroGridImages[0].src} alt={heroGridImages[0].alt} width="900" height="600" loading="lazy" className="w-full h-full object-cover" /></div>
                  <div className="aspect-square rounded-3xl overflow-hidden shadow-lg"><img src={heroGridImages[1].src} alt={heroGridImages[1].alt} width="900" height="600" loading="lazy" className="w-full h-full object-cover" /></div>
                </div>
                <div className="space-y-6 pt-12">
                  <div className="aspect-square rounded-3xl overflow-hidden shadow-lg"><img src={heroGridImages[2].src} alt={heroGridImages[2].alt} width="900" height="600" loading="lazy" className="w-full h-full object-cover" /></div>
                  <div className="aspect-square rounded-3xl overflow-hidden shadow-lg transform scale-110"><img src={heroGridImages[3].src} alt={heroGridImages[3].alt} width="900" height="600" loading="lazy" className="w-full h-full object-cover" /></div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 order-1 lg:order-2">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1A2B47] mb-8 leading-tight">
                Why Choose <span className="text-orange-600">Us?</span>
              </h2>
              <div className="space-y-8">
                <FeatureItem title="Authenticity" text="We blend global luxury with local culture, revealing Switzerland’s hidden gems." />
                <FeatureItem title="Excellence" text="Our fleet of high-end, meticulously maintained vehicles ensures comfort, safety, and punctuality." />
                <FeatureItem title="Personalisation" text="Every itinerary is flexible—whether a scenic road trip or a private mountain tour, you are in control." />
                <FeatureItem title="Passionate Guides" text="Our expert local guides bring each destination to life with insight and care." />
                <FeatureItem title="Seamless Travel" text="From airport pickup to your final destination, we take care of every detail." />
                <FeatureItem title="Lasting Memories" text="Every journey is crafted to create unforgettable experiences you will cherish forever." />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-6 sm:px-12 bg-gray-50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100 rounded-full blur-[100px] -mr-48 -mt-48 opacity-50" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h4 className="text-orange-600 font-bold uppercase tracking-[0.3em] mb-4">Guest Experiences</h4>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1A2B47]">Testimonials</h2>
          </div>
          
          <div className="flex md:grid md:grid-cols-2 gap-8 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 sm:mx-0 sm:px-0">
            <div className="min-w-[90%] md:min-w-0 snap-center">
              <TestimonialCard 
                name="Michael C."
                location="United Kingdom"
                text="Our private Lucerne and mount titles tour booked with AJL Tours surpassed all expectations. The planning was superb and our guide was highly knowledgeable, sharing incredible local insights that one could never know about, on their own. It was truly a premium and first class experience provided by AJL Tours."
              />
            </div>
            <div className="min-w-[90%] md:min-w-0 snap-center">
              <TestimonialCard 
                name="Lara J."
                location="United States"
                text="We went for a tour of Grindelwald and Interlaken using AJL Tours and it was one of our most memorable experiences so far. From a luxurious vehicle to a very passionate guide, every moment was perfectly handled by the AJL Team. This was our first time experiencing Switzerland and its beauty at our own pace."
              />
            </div>
            <div className="min-w-[90%] md:min-w-0 snap-center">
              <TestimonialCard 
                name="Hala F."
                location="UAE"
                text="Our main highlight of our European trip was our visit to Zermatt and Matterhorn, which we booked using AJL Tours. The scenic views were awesome inspiring and breathtaking and it was made even more special due to the personalised service provided by AJL Tours. They combined warmth with professionalism."
              />
            </div>
            <div className="min-w-[90%] md:min-w-0 snap-center">
              <TestimonialCard 
                name="Ming Yen S."
                location="Taiwan"
                text="As a frequent traveller using guide services, I have to say that my Switzerland trip was made hassle free with an amazing chauffeur who saved up so much time while also showing me around the beautiful views of Switzerland. The private service with a vast range of options and flexibility was superb and outstanding."
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 sm:px-12 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1A2B47] mb-4">FAQ’s</h2>
            <p className="text-lg text-gray-600">Everything you need to know about AJL Tours</p>
          </div>
          
          <div className="space-y-4">
            <FaqItem 
              question="Q1:- Are your tours group based or private based?"
              answer="Whilst most of our tours are private and personalised, we provide small group based tours as well for guests who enjoy a shared experience. For private based tours, you can tailor the entire tour to your interests."
              isOpen={openFaq === 0}
              toggle={() => setOpenFaq(openFaq === 0 ? null : 0)}
            />
            <FaqItem 
              question="Q2:- Can I customise my tour?"
              answer="Yes, our specialisation lies in the area of personalisation and tailor made tours, where guests can adjust the entire schedule, including the destinations they visit, timings, vehicles and much more, to one's own interests."
              isOpen={openFaq === 1}
              toggle={() => setOpenFaq(openFaq === 1 ? null : 1)}
            />
            <FaqItem 
              question="Q3:- What is included in the tour price?"
              answer="The tour price typically covers all costs including the tour guide, the private transportation, chauffeurs and a customised itinerary. Special additions may also vary from tour to tour."
              isOpen={openFaq === 2}
              toggle={() => setOpenFaq(openFaq === 2 ? null : 2)}
            />
             <FaqItem 
              question="Q4:- Do you provide airport or hotel pickup?"
              answer="Yes, we provide hassle free airport, hotels and train station pick-ups and drop-offs to ensure a seamless experience."
              isOpen={openFaq === 3}
              toggle={() => setOpenFaq(openFaq === 3 ? null : 3)}
            />
             <FaqItem 
              question="Q5:- What languages do your guides speak?"
              answer="Our guides speak a variety of languages including English, French, Italian and many other major languages. Please let us know your language preference at the time of booking."
              isOpen={openFaq === 4}
              toggle={() => setOpenFaq(openFaq === 4 ? null : 4)}
            />
             <FaqItem 
              question="Q6:- How far in advance should I book?"
              answer="We recommend bookings to be done at least 1 - 2 weeks in advance prior to the trip in order to secure specific dates, especially during peak travel seasons."
              isOpen={openFaq === 5}
              toggle={() => setOpenFaq(openFaq === 5 ? null : 5)}
            />
             <FaqItem 
              question="Q7:- Are your tours Family Friendly?"
              answer="Absolutely, our trips are family friendly and can be personalised to accommodate seniors or children, for a much more seamless experience with the family on board."
              isOpen={openFaq === 6}
              toggle={() => setOpenFaq(openFaq === 6 ? null : 6)}
            />
             <FaqItem 
              question="Q8:- Do you provide multi-day tours?"
              answer="Depending upon your choice, we can provide both single and multi-day private and small-group based tours of Switzerland."
              isOpen={openFaq === 7}
              toggle={() => setOpenFaq(openFaq === 7 ? null : 7)}
            />
             <FaqItem 
              question="Q9:- What happens in case of bad/extreme weather?"
              answer="In case of bad weather, alternatives including the change of date, time or destination is available when possible, at AJL Tours."
              isOpen={openFaq === 8}
              toggle={() => setOpenFaq(openFaq === 8 ? null : 8)}
            />
             <FaqItem 
              question="Q10:- How do I book a tour with AJL Tours?"
              answer="Bookings can be made directly through our website or contact us to customise and modify your itinerary. Our team will guide you throughout the process of your booking with AJL Tours."
              isOpen={openFaq === 9}
              toggle={() => setOpenFaq(openFaq === 9 ? null : 9)}
            />
          </div>
        </div>
      </section>

      {/* How to Book Section */}
      <section className="py-24 px-6 sm:px-12 bg-[#ff6b35] text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-4">How to Book Your Experience</h2>
            <p className="text-xl text-white/90">Booking with AJL Tours is simple, seamless, and fully tailored to your needs</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <BookingStep number="1" title="Passenger Details" text="Let us know passengers and luggage so we recommend the ideal vehicle." />
            <BookingStep number="2" title="Destination" text="Choose Swiss destinations and share your interests for a custom itinerary." />
            <BookingStep number="3" title="Stops & Requests" text="Include scenic stops or unique experiences to make your journey personal." />
            <BookingStep number="4" title="Hotel Bookings" text="We can arrange luxury or boutique hotel accommodation for you." />
          </div>
        </div>
      </section>
    </div>
  );
};

const ServiceCard = ({ icon, title, description }) => (
  <div className="bg-white p-10 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
    <div className="bg-orange-50 w-20 h-20 rounded-2xl flex items-center justify-center text-orange-600 mb-8 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
      {React.cloneElement(icon, { size: 40 })}
    </div>
    <h3 className="text-2xl font-bold text-[#1A2B47] mb-4">{title}</h3>
    <p className="text-gray-600 leading-relaxed font-medium">{description}</p>
  </div>
);

const FaqItem = ({ question, answer, isOpen, toggle }) => (
  <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm transition-all duration-300">
    <button 
      onClick={toggle}
      className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
    >
      <span className="text-xl font-bold text-[#1A2B47]">{question}</span>
      <div className={`p-2 rounded-xl transition-all duration-300 ${isOpen ? 'bg-orange-600 text-white rotate-180' : 'bg-gray-100 text-gray-500'}`}>
        <ChevronDown size={20} />
      </div>
    </button>
    <div className={`transition-all duration-500 overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
      <div className="px-8 pb-8 pt-2 text-lg text-gray-600 font-medium leading-relaxed">
        {answer}
      </div>
    </div>
  </div>
);

const BookingStep = ({ number, title, text }) => (
  <div className="relative group">
    <div className="bg-white/10 backdrop-blur-sm p-8 rounded-3xl border border-white/20 h-full flex flex-col items-center text-center hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2">
      <div className="w-16 h-16 bg-white text-orange-600 rounded-2xl flex items-center justify-center text-3xl font-black mb-6 shadow-lg shadow-black/10">
        {number}
      </div>
      <h4 className="text-xl font-bold mb-3">{title}</h4>
      <p className="text-sm text-white/80 leading-relaxed font-medium">{text}</p>
    </div>
    {number !== "5" && (
      <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 z-10">
        <div className="w-6 h-6 border-t-4 border-r-4 border-white/30 rotate-45" />
      </div>
    )}
  </div>
);

const FeatureItem = ({ title, text }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0">
      <div className="bg-orange-100 p-2 rounded-lg">
        <CheckCircle className="w-6 h-6 text-orange-600" />
      </div>
    </div>
    <div>
      <h4 className="text-xl font-bold text-[#1A2B47] mb-1">{title}</h4>
      <p className="text-gray-600 font-medium">{text}</p>
    </div>
  </div>
);

const TestimonialCard = ({ name, location, text }) => (
  <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col h-full relative group hover:shadow-xl transition-all duration-300">
    <Quote className="absolute top-10 right-10 w-12 h-12 text-gray-100 group-hover:text-orange-100 transition-colors" />
    <div className="flex gap-1 mb-6">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-5 h-5 fill-orange-500 text-orange-500" />
      ))}
    </div>
    <p className="text-xl text-[#1A2B47] font-medium leading-relaxed mb-8 flex-1 italic">
      “{text}”
    </p>
    <div className="flex items-center gap-4 border-t border-gray-50 pt-8">
      <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-200">
        {name[0]}
      </div>
      <div>
        <h5 className="font-bold text-[#1A2B47] text-lg">{name}</h5>
        <p className="text-orange-600 font-bold text-sm uppercase tracking-widest">{location}</p>
      </div>
    </div>
  </div>
);

export default Home2;
