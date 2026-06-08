import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Home, Heart, ShoppingCart, History as HistoryIcon, MapPin, Globe, BookOpen, Info, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AppContext } from "../context/AppContext.jsx";
import { assets } from "../assets/assets.js";
import { useAdmin } from "../context/AdminContext";
import { getTourId } from "../utils/tourId";
import { fetchToursList } from "../services/toursApi";
import CurrencySelector from "./CurrencySelector";

const Navbar = () => {
  const { user, logout } = useContext(AppContext);
  const { isAdmin, disableAdmin } = useAdmin();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [destinationsOpen, setDestinationsOpen] = useState(false);
  const location = useLocation();
  const isDestinationsActive =
    destinationsOpen ||
    location.pathname.startsWith("/switzerland") ||
    location.pathname.startsWith("/srilanka");
  const destinationsRef = useRef(null);
  // Initialize search visibility: show on all pages except homepage (where it shows after scroll)
  const [showCompactSearch, setShowCompactSearch] = useState(location.pathname !== "/");
  const [navQuery, setNavQuery] = useState("");
  const [allTours, setAllTours] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef(null);
  const toursRequestRef = useRef(null);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Close destinations dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        destinationsRef.current &&
        !destinationsRef.current.contains(event.target)
      ) {
        setDestinationsOpen(false);
      }
    };

    if (destinationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [destinationsOpen]);

  const loadToursForNavigation = async () => {
    if (allTours.length > 0) return allTours;
    if (toursRequestRef.current) return toursRequestRef.current;

    const request = fetchToursList({ view: 'search', limit: 100 });
    toursRequestRef.current = request;
    try {
      const tours = await request;
      setAllTours(tours);
      return tours;
    } catch (error) {
      console.error('Error fetching tours for search:', error);
      setAllTours([]);
      toursRequestRef.current = null;
      return [];
    }
  };

  // Show search bar: always visible except when on homepage hero section
  useEffect(() => {
    const onScroll = () => {
      const isHomepage = location.pathname === "/";
      if (isHomepage) {
        // On homepage: only show after scrolling past hero (threshold ~280px)
        const threshold = 280;
        setShowCompactSearch(window.scrollY > threshold);
      } else {
        // On other pages: always show search bar
        setShowCompactSearch(true);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // Check initial state
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname]);

  // Handle search input change - show suggestions as user types
  const handleNavSearchChange = (query) => {
    setNavQuery(query);
    if (query.trim() === "") {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const applyFilter = (tours) => {
      const filtered = tours.filter(tour => {
        const tourName = (tour.name || '').toLowerCase();
        const tourDescription = (tour.description || '').toLowerCase();
        const searchTerm = query.toLowerCase();
        return tourName.includes(searchTerm) || tourDescription.includes(searchTerm);
      }).slice(0, 5); // Limit to 5 results

      setSearchResults(filtered);
      setShowSearchDropdown(filtered.length > 0);
    };

    if (allTours.length > 0) {
      applyFilter(allTours);
      return;
    }

    loadToursForNavigation().then((tours) => {
      if (query.trim() !== "") applyFilter(tours);
    });
  };

  // Handle search result click - navigate to specific tour
  const handleSearchResultClick = (tour) => {
    const tourId = getTourId(tour);
    if (tourId) {
      setNavQuery(tour.name);
      setShowSearchDropdown(false);
      // Use replace: false and state to ensure route change is detected
      navigate(`/switzerland/${tourId}/checkout-sw`, { 
        replace: false,
        state: { tour: tour, fromSearch: true }
      });
      // Scroll to top when navigating to new tour
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle search form submit
  const handleNavSearch = async (e) => {
    e.preventDefault();
    const query = navQuery.trim();
    if (!query) return;
    const tours = allTours.length > 0 ? allTours : await loadToursForNavigation();
    
    // If there are search results, navigate to the first one
    if (searchResults.length > 0) {
      handleSearchResultClick(searchResults[0]);
    } else {
      // Otherwise, try to find exact match
      const match = tours.find(tour => 
        (tour.name || '').toLowerCase() === query.toLowerCase()
      );
      if (match) {
        handleSearchResultClick(match);
      } else {
        // Fallback to Switzerland page
        navigate("/switzerland");
      }
    }
  };

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowSearchDropdown(false);
      }
    };

    if (showSearchDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSearchDropdown]);

  return (
    <div className="w-full flex justify-between items-center py-2 px-3 sm:py-3 sm:px-6 md:px-16 top-0 sticky z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        <Link to="/" className="shrink-0">
          <img
            src="/logoTravel.png"
            width="350"
            height="100"
            className="w-[110px] sm:w-[150px] md:w-[190px]"
            alt="AJL Tour logo"
          />
        </Link>

        {/* Compact search (shows after scroll) */}
        {showCompactSearch && (
          <div ref={searchContainerRef} className="hidden lg:block relative" style={{ minWidth: "280px", maxWidth: "440px" }}>
            <form
              onSubmit={handleNavSearch}
              className="flex items-center gap-2 bg-white rounded-full px-4 py-2.5 shadow-lg border-2 border-gray-200 hover:border-orange-400 focus-within:border-orange-500 focus-within:shadow-xl transition-all duration-200"
            >
              <svg 
                className="w-5 h-5 text-gray-400 flex-shrink-0" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={navQuery}
                onChange={(e) => handleNavSearchChange(e.target.value)}
                onFocus={() => {
                  loadToursForNavigation();
                  if (searchResults.length > 0) {
                    setShowSearchDropdown(true);
                  }
                }}
                placeholder="Find places and things to do"
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none min-w-0 truncate"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white rounded-full text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-100"
              >
                Search
              </button>
            </form>

            {/* Search Results Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-xl shadow-2xl border-2 border-gray-100 z-50 max-h-80 overflow-y-auto backdrop-blur-sm">
                {searchResults.map((tour) => {
                  const tourId = getTourId(tour);
                  const tourName = tour.name || 'Unnamed Tour';
                  return (
                    <button
                      key={tourId}
                      type="button"
                      onClick={() => handleSearchResultClick(tour)}
                      className="w-full text-left px-5 py-3.5 hover:bg-orange-50 hover:border-l-4 hover:border-l-orange-500 transition-all duration-150 border-b border-gray-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl group"
                    >
                      <div className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">{tourName}</div>
                      {tour.description && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-1 group-hover:text-gray-600">
                          {tour.description}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Flex container for small screens */}
      <div className="flex items-center gap-3 sm:hidden">
        <Link to="/favorites" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Heart className="w-6 h-6 text-gray-700" />
        </Link>
        <Link to="/checkout" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ShoppingCart className="w-6 h-6 text-gray-700" />
        </Link>
        <button 
          onClick={toggleMenu} 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <X className="w-6 h-6 text-black" />
          ) : (
            <Menu className="w-6 h-6 text-black" />
          )}
        </button>
      </div>

      {/* Menu for desktop */}
      <div className="hidden sm:flex items-center gap-4">
        <ul className="flex items-center gap-2 text-sm font-semibold">
          <li>
            <Link
              to="/"
              className={`inline-flex items-center rounded-full px-4 py-2 transition-colors ${
                location.pathname === "/"
                  ? "bg-orange-50 text-orange-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-orange-600"
              }`}
            >
              Home
            </Link>
          </li>

          {/* Destinations dropdown */}
          <li
            className="group relative"
            ref={destinationsRef}
            onMouseEnter={() => setDestinationsOpen(true)}
            onMouseLeave={() => setDestinationsOpen(false)}
          >
            <button
              type="button"
              title="Destinations"
              onFocus={() => setDestinationsOpen(true)}
              onClick={() => setDestinationsOpen((current) => !current)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 transition-colors ${
                isDestinationsActive
                  ? "bg-orange-50 text-orange-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-orange-600"
              }`}
            >
              Destinations
              <ChevronDown className={`h-4 w-4 transition-transform ${destinationsOpen ? "rotate-180" : ""}`} />
            </button>

              <div
                className={`absolute left-0 top-full z-40 w-64 pt-3 text-left transition duration-150 group-hover:visible group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 ${
                  destinationsOpen
                    ? "visible pointer-events-auto translate-y-0 opacity-100"
                    : "invisible pointer-events-none translate-y-2 opacity-0"
                }`}
              >
                <div className="rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                  <Link
                    to="/switzerland"
                    onClick={() => setDestinationsOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-gray-900 transition hover:bg-orange-50 hover:text-orange-700"
                  >
                    <MapPin className="h-4 w-4 text-orange-600" />
                    Switzerland
                  </Link>
                  <Link
                    to="/srilanka"
                    onClick={() => setDestinationsOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-gray-900 transition hover:bg-orange-50 hover:text-orange-700"
                  >
                    <MapPin className="h-4 w-4 text-orange-600" />
                    Srilanka
                  </Link>
                </div>
              </div>
          </li>

          <li>
            <Link
              to="/tours"
              className={`inline-flex items-center rounded-full px-4 py-2 transition-colors ${
                location.pathname === "/tours"
                  ? "bg-orange-50 text-orange-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-orange-600"
              }`}
            >
              Tours
            </Link>
          </li>
          <li>
            <Link
              to="/blogs"
              className={`inline-flex items-center rounded-full px-4 py-2 transition-colors ${
                location.pathname.startsWith("/blogs")
                  ? "bg-orange-50 text-orange-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-orange-600"
              }`}
            >
              Blogs
            </Link>
          </li>
          <li>
            <Link
              to="/about"
              className={`inline-flex items-center rounded-full px-4 py-2 transition-colors ${
                location.pathname === "/about"
                  ? "bg-orange-50 text-orange-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-orange-600"
              }`}
            >
              About
            </Link>
          </li>
          <li>
            <Link
              to="/contact"
              className={`inline-flex items-center rounded-full px-4 py-2 transition-colors ${
                location.pathname === "/contact"
                  ? "bg-orange-50 text-orange-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-orange-600"
              }`}
            >
              Contact
            </Link>
          </li>
          <li>
            <Link
              to="/favorites"
              title="Favorites"
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                location.pathname === "/favorites"
                  ? "bg-orange-50 text-orange-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-orange-600"
              }`}
            >
              <Heart className="h-6 w-6" />
              <span className="sr-only">Favorites</span>
            </Link>
          </li>
          <li>
            <Link
              to="/checkout"
              title="Checkout"
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                location.pathname === "/checkout"
                  ? "bg-orange-50 text-orange-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-orange-600"
              }`}
            >
              <ShoppingCart className="h-6 w-6" />
              <span className="sr-only">Checkout</span>
            </Link>
          </li>
        </ul>
        <CurrencySelector compact />
        {(user || isAdmin) ? (
          <div className="flex items-center gap-3">
            <div className="relative group">
              {isAdmin ? (
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-gray-100">
                  <img src={assets.user} alt="profile" className="h-7 w-7 object-contain" />
                </span>
              ) : (
                <Link
                  to="/dashboard"
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                    location.pathname.startsWith("/dashboard")
                      ? "bg-orange-50"
                      : "hover:bg-gray-100"
                  }`}
                  aria-label="Open customer dashboard"
                  title="Dashboard"
                >
                  <img src={assets.user} alt="" className="h-7 w-7 object-contain" />
                </Link>
              )}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-12 p-2 bg-black text-white rounded opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                {isAdmin ? 'Admin is logged in' : `Hi, ${user?.name || 'User'}`}
              </div>
            </div>
            {isAdmin ? (
              <button
                onClick={disableAdmin}
                className="inline-flex h-11 items-center justify-center rounded-lg border-2 border-orange-600 px-6 text-base font-bold text-orange-600 transition-colors hover:bg-orange-600 hover:text-white"
              >
                Logout
              </button>
            ) : (
              <button onClick={logout} className="inline-flex h-11 items-center justify-center rounded-lg border-2 border-orange-600 px-6 text-base font-bold text-orange-600 transition-colors hover:bg-orange-600 hover:text-white">Logout</button>
            )}
          </div>
        ) : (
          <Link to="/login" className="inline-flex h-11 items-center justify-center rounded-lg border-2 border-orange-600 px-6 text-base font-bold text-orange-600 transition-colors hover:bg-orange-600 hover:text-white">
            Login
          </Link>
        )}
      </div>

      {/* Mobile Menu Side Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="sm:hidden fixed inset-0 bg-black/50 z-[60]"
            />

            {/* Side Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="sm:hidden fixed top-0 right-0 h-screen w-[85%] max-w-[320px] bg-white z-[70] shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="bg-[#ff6b35] py-6 px-4 flex justify-end items-center">
                <button 
                  onClick={() => setMenuOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="py-2">
                  <DrawerLink
                    to="/"
                    icon={<Home className="w-5 h-5" />}
                    label="Home"
                    onClick={() => setMenuOpen(false)}
                  />

                  <h3 className="px-6 pt-5 pb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                    Destinations
                  </h3>
                  <DrawerLink
                    to="/switzerland"
                    icon={<MapPin className="w-5 h-5" />}
                    label="Switzerland"
                    onClick={() => setMenuOpen(false)}
                  />
                  <DrawerLink
                    to="/srilanka"
                    icon={<MapPin className="w-5 h-5" />}
                    label="Srilanka"
                    onClick={() => setMenuOpen(false)}
                  />

                  <h3 className="px-6 pt-5 pb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                    Menu
                  </h3>
                  <DrawerLink
                    to="/tours"
                    icon={<ShoppingCart className="w-5 h-5" />}
                    label="Tours"
                    onClick={() => setMenuOpen(false)}
                  />
                  <DrawerLink
                    to="/blogs"
                    icon={<BookOpen className="w-5 h-5" />}
                    label="Blogs"
                    onClick={() => setMenuOpen(false)}
                  />
                  <DrawerLink
                    to="/about"
                    icon={<Info className="w-5 h-5" />}
                    label="About Us"
                    onClick={() => setMenuOpen(false)}
                  />
                  <DrawerLink
                    to="/contact"
                    icon={<Globe className="w-5 h-5" />}
                    label="Contact Us"
                    onClick={() => setMenuOpen(false)}
                  />
                </div>

                <div className="mt-6">
                  <h3 className="px-6 text-xl font-bold text-[#ff6b35] mb-4">Profile</h3>
                  
                  {user || isAdmin ? (
                    <>
                      <Link
                        to={isAdmin ? "/admin/dashboard" : "/dashboard"}
                        onClick={() => setMenuOpen(false)}
                        className="px-6 py-4 flex items-center gap-3 border-b border-gray-100 hover:bg-gray-50"
                      >
                        <img src={assets.user} alt="" className="w-10 h-10 rounded-full border border-gray-200" />
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1">{isAdmin ? 'Admin' : (user?.name || 'User')}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                        </div>
                      </Link>
                      <DrawerLink
                        to="/favorites"
                        icon={<Heart className="w-5 h-5" />}
                        label="Favorites"
                        onClick={() => setMenuOpen(false)}
                      />
                      <DrawerLink
                        to="/history"
                        icon={<HistoryIcon className="w-5 h-5" />}
                        label="History"
                        onClick={() => setMenuOpen(false)}
                      />
                      <div className="px-6 py-4">
                        <button
                          onClick={() => {
                            if (isAdmin) { disableAdmin(); } else { logout(); }
                            setMenuOpen(false);
                          }}
                          className="w-full button-31 py-2 text-sm"
                        >
                          Logout
                        </button>
                      </div>
                    </>
                  ) : (
                    <DrawerLink
                      to="/login"
                      icon={<Menu className="w-5 h-5" />}
                      label="Log in or sign up"
                      onClick={() => setMenuOpen(false)}
                    />
                  )
                }
                </div>

                {/* Additional Sections matching reference */}
                <div className="mt-4 border-t border-gray-100 pt-2">
                   <div className="px-6 py-4 flex items-center justify-between text-gray-700 hover:bg-gray-50 transition-colors">
                     <CurrencySelector className="w-full justify-between rounded-lg border-0 px-0 py-0 hover:text-gray-700" />
                   </div>
                   <div className="px-6 py-4 flex items-center justify-between text-gray-700 hover:bg-gray-50 transition-colors">
                     <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5" />
                       <span className="font-medium">Language</span>
                     </div>
                     <span className="text-sm text-gray-500 flex items-center gap-1">English <ChevronRight className="w-4 h-4" /></span>
                   </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper component for drawer links matching the reference style
const DrawerLink = ({ to, icon, label, onClick }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center justify-between px-6 py-4 border-b border-gray-100 text-[#ff6b35] hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium text-lg">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </Link>
  );
};

// Helper icon
const ChevronRight = ({ className }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export default Navbar;
