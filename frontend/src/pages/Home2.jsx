import React, { Suspense, lazy, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import { fetchToursList } from "../services/toursApi";
import { getTourId, getTourSeoPath } from "../utils/tourId";
import { cleanDisplayName } from "../utils/textFormatting";
import { organizationJsonLd } from "../utils/seo";
import { Search, MapPin, ChevronDown, Star, Quote } from "lucide-react";
import { useI18n } from "../i18n";

const ExploreTours = lazy(() => import("../components/ExploreTours"));
const TopDealsSection = lazy(() => import("../components/TopDealsSection"));
const HomeDeferredContent = lazy(() => import("./HomeDeferredContent"));
const HERO_AUTOPLAY_MS = 5000;
const HERO_TRANSITION_MS = 1000;
const hero4 = "/assets/images/optimized/hero4-1600.webp";
const hero5 = "/assets/images/optimized/hero5-1600.webp";
const hero6 = "/assets/images/optimized/hero6-1600.webp";
const hero7 = "/assets/images/optimized/hero7-1600.webp";
const hero4Small = "/assets/images/optimized/hero4-900.webp";
const hero5Small = "/assets/images/optimized/hero5-900.webp";
const hero6Small = "/assets/images/optimized/hero6-900.webp";
const hero6Mobile480 = "/assets/images/optimized/hero6-480.webp";
const hero6Mobile640 = "/assets/images/optimized/hero6-640.webp";
const hero6Mobile480Avif = "/assets/images/optimized/hero6-480.avif";
const hero6Mobile640Avif = "/assets/images/optimized/hero6-640.avif";
const hero7Small = "/assets/images/optimized/hero7-900.webp";
const defaultHeroImages = [hero4, hero5, hero6, hero7];
const mobileHeroAvifSrcSet = `${hero6Mobile480Avif} 480w, ${hero6Mobile640Avif} 640w`;
const mobileHeroWebpSrcSet = `${hero6Mobile480} 480w, ${hero6Mobile640} 640w`;
const heroImageSrcSets = {
  [hero4]: `${hero4Small} 900w, ${hero4} 1600w`,
  [hero5]: `${hero5Small} 900w, ${hero5} 1600w`,
  [hero6]: `${hero6Small} 900w, ${hero6} 1600w`,
  [hero7]: `${hero7Small} 900w, ${hero7} 1600w`,
};

const DeferredSection = ({ children, rootMargin = "700px", minHeight = 0, className = "" }) => {
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

  return (
    <div ref={ref} className={className} style={shouldRender ? undefined : { minHeight }}>
      {shouldRender ? children : null}
    </div>
  );
};

const Home2 = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHeroTransitioning, setIsHeroTransitioning] = useState(true);
  const [canAnimateHero, setCanAnimateHero] = useState(false);
  const [isDesktopHero, setIsDesktopHero] = useState(() => (
    typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
  ));

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchTours, setSearchTours] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchToursLoadedRef = useRef(false);

  // Keep homepage LCP independent from CMS/API hero banners.
  const heroImages = defaultHeroImages;
  const desktopHeroImages = canAnimateHero && heroImages.length > 1
    ? [...heroImages, heroImages[0]]
    : [heroImages[0]];

  const loadSearchTours = async () => {
    if (searchToursLoadedRef.current || searchLoading) return;
    searchToursLoadedRef.current = true;
    setSearchLoading(true);
    try {
      const tours = await fetchToursList({ limit: 100, view: "search" });
      setSearchTours(tours.filter((tour) => getTourId(tour) && tour?.isActive !== false));
    } catch (error) {
      searchToursLoadedRef.current = false;
      setSearchTours([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const normalizeSearchText = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const getTourRoute = (tour) => {
    const tourId = getTourId(tour);
    if (!tourId) return null;
    return getTourSeoPath(tour);
  };

  const buildTourSearchResults = (query) => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return [];

    const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);
    return searchTours
      .map((tour) => {
        const name = cleanDisplayName(tour?.name || tour?.title || "Tour");
        const normalizedName = normalizeSearchText(name);
        const route = getTourRoute(tour);
        return {
          name,
          type: "tour",
          route,
          tour,
          normalizedName,
        };
      })
      .filter((result) => (
        result.route &&
        (
          result.normalizedName.includes(normalizedQuery) ||
          queryWords.every((word) => result.normalizedName.includes(word))
        )
      ))
      .slice(0, 8);
  };

  // Search function
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!searchToursLoadedRef.current) {
      loadSearchTours();
    }
    if (query.trim() === "") {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setSearchResults(buildTourSearchResults(query));
    setShowDropdown(true);
  };

  // Handle search result click
  const handleSearchResultClick = (result) => {
    setSearchQuery(result.name);
    setShowDropdown(false);
    navigate(result.route, { state: { tour: result.tour } });
  };

  // Handle search button click
  const handleSearchButtonClick = () => {
    if (searchQuery.trim() !== "") {
      const result = searchResults[0] || buildTourSearchResults(searchQuery)[0];
      if (result) {
        handleSearchResultClick(result);
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

  React.useEffect(() => {
    if (searchQuery.trim()) {
      setSearchResults(buildTourSearchResults(searchQuery));
    }
  }, [searchTours]);

  // Auto-advance slowly and loop visually from last slide to first slide.
  React.useEffect(() => {
    if (!isDesktopHero || !canAnimateHero || heroImages.length <= 1) return undefined;

    const interval = setInterval(() => {
      setIsHeroTransitioning(true);
      setCurrentImageIndex((prevIndex) => prevIndex + 1);
    }, HERO_AUTOPLAY_MS);

    return () => clearInterval(interval);
  }, [canAnimateHero, heroImages.length, isDesktopHero]);

  React.useEffect(() => {
    if (!canAnimateHero || heroImages.length <= 1 || currentImageIndex !== heroImages.length) return undefined;

    const timeout = window.setTimeout(() => {
      setIsHeroTransitioning(false);
      setCurrentImageIndex(0);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setIsHeroTransitioning(true));
      });
    }, HERO_TRANSITION_MS);

    return () => window.clearTimeout(timeout);
  }, [canAnimateHero, currentImageIndex, heroImages.length]);

  React.useEffect(() => {
    setIsHeroTransitioning(false);
    setCurrentImageIndex(0);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setIsHeroTransitioning(true));
    });
  }, [heroImages.join("|")]);

  React.useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const updateHeroMode = () => setIsDesktopHero(media.matches);

    updateHeroMode();
    media.addEventListener?.("change", updateHeroMode);
    return () => media.removeEventListener?.("change", updateHeroMode);
  }, []);

  React.useEffect(() => {
    if (!isDesktopHero || canAnimateHero) return undefined;

    let timeoutId;
    const enableAfterLoad = () => {
      timeoutId = window.setTimeout(() => setCanAnimateHero(true), 6000);
    };

    if (document.readyState === "complete") {
      enableAfterLoad();
    } else {
      window.addEventListener("load", enableAfterLoad, { once: true });
    }

    const enableOnInteraction = () => {
      window.clearTimeout(timeoutId);
      setCanAnimateHero(true);
    };
    window.addEventListener("pointerdown", enableOnInteraction, { once: true, passive: true });
    window.addEventListener("keydown", enableOnInteraction, { once: true });

    return () => {
      window.removeEventListener("load", enableAfterLoad);
      window.removeEventListener("pointerdown", enableOnInteraction);
      window.removeEventListener("keydown", enableOnInteraction);
      window.clearTimeout(timeoutId);
    };
  }, [canAnimateHero, isDesktopHero]);

  return (
    <div className="min-h-screen">
      <SEO
        title={t("seo.homeTitle")}
        description={t("seo.homeDescription")}
        structuredData={organizationJsonLd}
      />

      {/* Hero Section - Full Width Background */}
      <section className="home-hero relative h-[70vh] sm:h-[60vh] md:h-screen w-full overflow-hidden bg-gray-900">
        {/* Mobile Background */}
        {!isDesktopHero && (
        <div className="home-hero-bg home-hero-mobile absolute inset-0 z-0">
          {heroImages.length > 0 && (
            <picture>
              <source type="image/avif" srcSet={mobileHeroAvifSrcSet} sizes="100vw" />
              <source type="image/webp" srcSet={mobileHeroWebpSrcSet} sizes="100vw" />
              <img
                src={hero6Mobile640Avif}
                srcSet={mobileHeroAvifSrcSet}
                sizes="100vw"
                alt="Private Switzerland tour through an alpine mountain landscape"
                width="900"
                height="600"
                fetchPriority="high"
                loading="eager"
                decoding="async"
                className="home-hero-img absolute inset-0 h-full w-full object-cover object-top"
              />
            </picture>
          )}
        </div>
        )}

        {/* Desktop Background: Carousel */}
        {isDesktopHero && (
        <div className="home-hero-bg home-hero-desktop absolute inset-0 z-0">
          <div 
            className={`home-hero-desktop-track flex h-full ease-in-out ${isHeroTransitioning ? "transition-transform duration-1000" : ""}`}
            style={{ 
              width: `${Math.max(desktopHeroImages.length, 1) * 100}%`,
              transform: desktopHeroImages.length
                ? `translateX(-${(currentImageIndex / desktopHeroImages.length) * 100}%)`
                : "translateX(0)"
            }}
          >
            {desktopHeroImages.map((image, index) => (
              <div
                key={index}
                className="home-hero-desktop-slide relative h-full overflow-hidden"
                style={{ 
                  width: `${100 / desktopHeroImages.length}%`
                }}
              >
                <img
                  src={image}
                  srcSet={heroImageSrcSets[image]}
                  sizes="100vw"
                  alt=""
                  width="1600"
                  height="1067"
                  fetchPriority={index === 0 ? "high" : "auto"}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="home-hero-desktop-img h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
        )}
        {/* Hero Content */}
        <div className="home-hero-content-wrap absolute inset-0 z-20 flex items-center h-full">
          <div className="home-hero-content text-white ml-4 sm:ml-8 md:ml-16 lg:ml-24 px-4 sm:px-0 w-full max-w-4xl">
            <h1 className="home-hero-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 drop-shadow-2xl leading-tight">
              {t("home.heroTitle")}
            </h1>
            
            <p className="home-hero-subtitle text-lg sm:text-xl md:text-2xl text-white/95 mb-10 max-w-2xl font-medium leading-relaxed drop-shadow-lg">
              {t("home.heroSubtitle")}
            </p>

            {/* Search Destination Bar */}
            <div className="home-hero-search w-full md:max-w-[700px] relative search-container">
              <div className="home-hero-search-box flex items-center backdrop-blur-md rounded-full shadow-2xl px-3 sm:px-4 py-2 sm:py-4 transition-all duration-300 focus-within:ring-4 focus-within:ring-orange-500/30" style={{ backgroundColor: 'rgb(255 255 255 / 0.98)' }}>
                <Search className="home-hero-search-icon w-5 h-5 sm:w-6 sm:h-6 text-orange-700 mr-2 sm:mr-3 shrink-0" />
                <input
                  type="text"
                  className="home-hero-search-input flex-1 bg-transparent outline-none text-sm sm:text-lg text-black placeholder-gray-500 min-w-0"
                  placeholder={t("nav.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => {
                    loadSearchTours();
                    if (searchQuery.trim() !== "") setShowDropdown(true);
                  }}
                  autoComplete="off"
                />
                <button 
                  className="home-hero-search-button bg-orange-700 hover:bg-black text-white font-bold px-4 sm:px-10 py-2 sm:py-4 rounded-full transition-all duration-300 text-sm sm:text-lg whitespace-nowrap flex-shrink-0 shadow-lg ml-1"
                  onClick={handleSearchButtonClick}
                >
                  {t("nav.search")}
                </button>
              </div>
              
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-80 overflow-y-auto">
                  {searchLoading ? (
                    <div className="px-6 py-6 text-gray-500 text-center font-medium">
                      {t("nav.loadingTours")}
                    </div>
                  ) : searchResults.length > 0 ? (
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
                      {t("nav.noMatches")}
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
                {t("home.introTitle")}
              </h2>
              <div className="space-y-6 text-lg text-gray-700 leading-relaxed font-medium">
                <p>
                  {t("home.introText")}
                </p>
                <div className="bg-orange-50 p-8 rounded-3xl border-l-8 border-orange-500 shadow-sm relative overflow-hidden">
                  <Quote className="absolute top-4 right-4 w-12 h-12 text-orange-200" />
                  <p className="text-2xl font-bold text-[#1A2B47] italic mb-4 relative z-10 font-serif">
                    “{t("home.quote")}”
                  </p>
                  <p className="text-orange-800 font-bold uppercase tracking-widest text-sm">— {t("home.quoteAuthor")}</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl">
                <picture>
                  <source type="image/avif" srcSet={mobileHeroAvifSrcSet} sizes="(max-width: 1024px) 100vw, 50vw" />
                  <source type="image/webp" srcSet={mobileHeroWebpSrcSet} sizes="(max-width: 1024px) 100vw, 50vw" />
                  <img
                    src={hero6Mobile640Avif}
                    alt="Swiss Alps scenery for a private Switzerland tour"
                    width="900"
                    height="600"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-1000"
                  />
                </picture>
              </div>
              <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-3xl shadow-xl border border-gray-100 hidden sm:block">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-600 p-3 rounded-2xl">
                    <Star className="text-white w-8 h-8 fill-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-black">100%</div>
                    <div className="text-sm text-gray-500 font-bold uppercase tracking-wider">{t("home.premiumExperience")}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Explore Tours Section */}
      <DeferredSection minHeight={720}>
        <Suspense fallback={null}>
          <ExploreTours />
        </Suspense>
      </DeferredSection>

      {/* Top Deals Section */}
      <DeferredSection minHeight={640}>
        <Suspense fallback={null}>
          <TopDealsSection />
        </Suspense>
      </DeferredSection>

      <DeferredSection minHeight={4200}>
        <Suspense fallback={null}>
          <HomeDeferredContent />
        </Suspense>
      </DeferredSection>
    </div>
  );
};

export default Home2;
