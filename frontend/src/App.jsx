import React, { Suspense, lazy, useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import PlaneLoader from "./components/PlaneLoader";
import { useContext } from "react";
import { AppContext } from "./context/AppContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { EditModeProvider } from "./context/EditModeContext";
import { useAdmin } from "./context/AdminContext";
import { useI18n } from "./i18n";
import Home2 from "./pages/Home2";
import SEO from "./components/SEO";

const Tour = lazy(() => import("./pages/Tour"));
const TourDetails = lazy(() => import("./pages/TourDetails"));
const Login = lazy(() => import("./pages/Login"));
const Booking = lazy(() => import("./pages/Booking"));
const Invoice = lazy(() => import("./pages/Invoice"));
const About = lazy(() => import("./pages/About"));
const SwitzerlandLocations = lazy(() => import("./pages/SwitzerlandLocations"));
const SrilankaLocations = lazy(() => import("./pages/SrilankaLocations"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminTrips = lazy(() => import("./pages/AdminTrips"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminDivisions = lazy(() => import("./pages/AdminDivisions"));
const AdminUpdateTours = lazy(() => import("./pages/AdminUpdateTours"));
const AdminTravelRecords = lazy(() => import("./pages/AdminTravelRecords"));
const AdminHeroBanners = lazy(() => import("./pages/AdminHeroBanners"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Payment = lazy(() => import("./pages/Payment"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentFailure = lazy(() => import("./pages/PaymentFailure"));
const Contact = lazy(() => import("./pages/Contact"));
const UserDetails = lazy(() => import("./pages/UserDetails"));
const Flexibility = lazy(() => import("./pages/Flexibility"));
const Favorites = lazy(() => import("./pages/Favorites"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const Blogs = lazy(() => import("./pages/Blogs"));
const BookingHistory = lazy(() => import("./pages/BookingHistory"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const VerifyOTP = lazy(() => import("./pages/VerifyOTP"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const TourWizard = lazy(() => import("./pages/TourWizard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminNavbar = lazy(() => import("./components/AdminNavbar"));
const FloatingWhatsApp = lazy(() => import("./components/FloatingWhatsApp"));
const ToastContainer = lazy(() =>
  Promise.all([
    import("react-toastify"),
    import("react-toastify/dist/ReactToastify.css"),
  ]).then(([module]) => ({ default: module.ToastContainer }))
);


// Wrapper component to force remount when id changes
const CheckoutWrapper = () => {
  const { id } = useParams();
  return (
    <>
      <SEO
        title="Tour Booking | AJL Tours"
        description="Review tour details and booking options for your selected AJL Tours experience."
        noIndex
      />
      <Checkout key={id} />
    </>
  );
};

const LegacySriLankaCheckoutRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/sri-lanka/${id}/checkout`} replace />;
};

const useAfterFirstPaint = (delay = 1200) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const schedule = window.requestIdleCallback || ((callback) => window.setTimeout(callback, delay));
    const cancel = window.cancelIdleCallback || window.clearTimeout;
    const id = schedule(() => setReady(true), { timeout: delay });
    return () => cancel(id);
  }, [delay]);

  return ready;
};

const AdminRoute = ({ children }) => {
  const { isAdmin: legacyAdmin, loading: appLoading } = useContext(AppContext);
  const { isAdmin: jwtAdmin, loading: adminLoading } = useAdmin();
  if (appLoading || adminLoading) return <PlaneLoader label="Checking admin access" />;
  return legacyAdmin || jwtAdmin ? children : <Navigate to="/admin" replace />;
};

const App = () => {
  const location = useLocation();
  const { isAdmin } = useContext(AppContext);
  const { isAdmin: isAuthenticatedAdmin } = useAdmin();
  const { t } = useI18n();
  const canLoadNonCriticalUi = useAfterFirstPaint();
  const [showPasscodePrompt, setShowPasscodePrompt] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  // Global admin shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Use Ctrl+Shift+A instead to avoid conflict with Select All
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setShowPasscodePrompt(true);
        setError("");
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const ADMIN_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || "";

  const handlePasscodeSubmit = (e) => {
    e.preventDefault();
    if (!ADMIN_PASSCODE) {
      setError("Admin passcode is not configured");
      return;
    }
    if (passcode === ADMIN_PASSCODE) {
      setError("");
      setShowPasscodePrompt(false);
      // Set admin state in localStorage
      localStorage.setItem("isAdmin", "true");
      localStorage.setItem("isAdminMode", "true");
      // Don't reload, just update context
      window.location.reload(); // Keep this to ensure all components update properly
    } else {
      setError("Invalid passcode");
    }
  };

  const handleCancel = () => {
    setShowPasscodePrompt(false);
    setPasscode("");
    setError("");
  };

  return (
    <CurrencyProvider>
        <EditModeProvider>
          <div className="flex flex-col min-h-screen bg-neutral-100">
          {canLoadNonCriticalUi && (
            <Suspense fallback={null}>
              <ToastContainer theme="dark" position="bottom-right" autoClose={1000} />
            </Suspense>
          )}
          {location.pathname.startsWith("/admin") && (isAdmin || isAuthenticatedAdmin)
            ? (
              <Suspense fallback={null}>
                <AdminNavbar />
              </Suspense>
            )
            : <Navbar />}
          <main className="flex-1">
            <Suspense fallback={<PlaneLoader label={t("common.loading")} />}>
            <Routes>
              <Route path="/" element={<Home2 />} />
              <Route path="/tours" element={<Tour />} />
              <Route path="/about" element={<About />} />
              <Route path="/tours/:id" element={<TourDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/invoice" element={<Invoice />} />
              <Route path="/locations" element={<Navigate to="/switzerland" replace />} />
              <Route path="/destinations" element={<SwitzerlandLocations isDestinationsPage />} />
              <Route path="/switzerland" element={<SwitzerlandLocations />} />
              <Route path="/sri-lanka" element={<SrilankaLocations />} />
              <Route path="/srilanka" element={<Navigate to="/sri-lanka" replace />} />
              <Route path="/switzerland/:id/checkout" element={<CheckoutWrapper />} />
              <Route path="/sri-lanka/:id/checkout" element={<CheckoutWrapper />} />
              <Route path="/srilanka/:id/checkout" element={<LegacySriLankaCheckoutRedirect />} />
              <Route 
                path="/switzerland/:id/checkout-sw" 
                element={<CheckoutWrapper />} 
              />
              <Route 
                path="/srilanka/:id/checkout-sw"
                element={<LegacySriLankaCheckoutRedirect />}
              />
              <Route path="/checkout" element={<CheckoutWrapper />} />
          <Route path="/history" element={<BookingHistory />} />
              <Route path="/home1" element={<Navigate to="/" replace />} />
              <Route path="/booking-options" element={<Flexibility />} />
              <Route path="/flexibility" element={<Navigate to="/booking-options" replace />} />
              <Route path="/userDetails" element={<UserDetails />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-failure" element={<PaymentFailure />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/visit-checkout-2" element={<Navigate to="/tours" replace />} />
              <Route path="/visit-checkout-2/:id" element={<Navigate to="/tours" replace />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/dashboard" element={<CustomerDashboard />} />
              <Route path="/account" element={<Navigate to="/dashboard" replace />} />
              <Route path="/blogs" element={<Blogs />} />
              <Route path="/blogs/:id" element={<BlogPost />} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/trips" element={<AdminRoute><AdminTrips /></AdminRoute>} />
              <Route path="/admin/divisions" element={<AdminRoute><AdminDivisions /></AdminRoute>} />
              <Route path="/admin/tours" element={<AdminRoute><AdminUpdateTours /></AdminRoute>} />
              <Route path="/admin/hero-banners" element={<AdminRoute><AdminHeroBanners /></AdminRoute>} />
              <Route path="/admin/travel-records" element={<AdminRoute><AdminTravelRecords /></AdminRoute>} />
              <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
              <Route path="/admin/tour-wizard" element={<AdminRoute><TourWizard /></AdminRoute>} />
              <Route path="/tour-wizard" element={<Navigate to="/admin/tour-wizard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </main>
          <Footer />
          {canLoadNonCriticalUi && (
            <Suspense fallback={null}>
              <FloatingWhatsApp />
            </Suspense>
          )}
          
          {/* Global Admin Passcode Prompt */}
          {showPasscodePrompt && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4">Admin Access</h2>
                <form onSubmit={handlePasscodeSubmit} className="space-y-4">
                  <div>
                    <label className="block text-md font-medium mb-2">Enter Admin Passcode</label>
                    <input
                      type="password"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                      placeholder="Enter passcode"
                      autoFocus
                    />
                  </div>
                  {error && <div className="text-red-600">{error}</div>}
                  <div className="flex space-x-3">
                    <button 
                      type="submit" 
                      className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Access Admin
                    </button>
                    <button 
                      type="button" 
                      onClick={handleCancel}
                      className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
        </EditModeProvider>
    </CurrencyProvider>
  );
};

export default App;
