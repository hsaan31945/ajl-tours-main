import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Bell,
  CalendarDays,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  Heart,
  HelpCircle,
  Lock,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  Ticket,
  User,
  XCircle,
} from "lucide-react";
import {
  Document,
  Page,
  PDFDownloadLink,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { AppContext } from "../context/AppContext";
import { apiUrl } from "../utils/api";
import { getTourId } from "../utils/tourId";
import { useCurrency } from "../context/CurrencyContext";

const pdfStyles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, color: "#111827" },
  title: { fontSize: 22, marginBottom: 18, fontWeight: 700 },
  section: { marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { color: "#6B7280" },
  value: { color: "#111827", fontWeight: 700 },
});

const tabs = [
  { id: "overview", label: "Overview", icon: CalendarDays },
  { id: "bookings", label: "My Bookings", icon: Ticket },
  { id: "details", label: "Booking Details", icon: Eye },
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "support", label: "Support", icon: HelpCircle },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "security", label: "Security", icon: Shield },
];

const statusStyles = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed: "bg-green-50 text-green-700 border-green-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-blue-50 text-blue-700 border-blue-200",
  open: "bg-orange-50 text-orange-700 border-orange-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  resolved: "bg-green-50 text-green-700 border-green-200",
  closed: "bg-gray-50 text-gray-700 border-gray-200",
};

const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const formatDateTime = (value) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const bookingId = (booking) => booking?._id || booking?.id || booking?.bookingId || "";
const bookingTour = (booking) => booking?.tourId || booking?.tour || {};
const tourIdFromBooking = (booking) => {
  const tour = bookingTour(booking);
  return tour?._id || tour?.id || booking?.tourId || booking?.tour;
};

const getStatusClass = (value) => {
  const key = String(value || "pending").toLowerCase();
  return statusStyles[key] || "bg-gray-50 text-gray-700 border-gray-200";
};

const StatusBadge = ({ value }) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${getStatusClass(value)}`}>
    {String(value || "pending").replace("_", " ")}
  </span>
);

const EmptyState = ({ icon: Icon, title, text, action }) => (
  <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
    <Icon className="mb-3 h-10 w-10 text-gray-300" aria-hidden="true" />
    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
    {text && <p className="mt-2 max-w-md text-sm text-gray-600">{text}</p>}
    {action}
  </div>
);

const InvoicePDF = ({ booking, formatPrice }) => {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>AJL Tours Invoice</Text>
        <View style={pdfStyles.section}>
          <View style={pdfStyles.row}><Text style={pdfStyles.label}>Invoice</Text><Text style={pdfStyles.value}>AJL-{String(bookingId(booking)).slice(-8).toUpperCase()}</Text></View>
          <View style={pdfStyles.row}><Text style={pdfStyles.label}>Booking ID</Text><Text style={pdfStyles.value}>{bookingId(booking)}</Text></View>
          <View style={pdfStyles.row}><Text style={pdfStyles.label}>Created</Text><Text style={pdfStyles.value}>{formatDate(booking?.createdAt)}</Text></View>
        </View>
        <View style={pdfStyles.section}>
          <View style={pdfStyles.row}><Text style={pdfStyles.label}>Customer</Text><Text style={pdfStyles.value}>{booking?.name || ""}</Text></View>
          <View style={pdfStyles.row}><Text style={pdfStyles.label}>Email</Text><Text style={pdfStyles.value}>{booking?.email || ""}</Text></View>
          <View style={pdfStyles.row}><Text style={pdfStyles.label}>Phone</Text><Text style={pdfStyles.value}>{booking?.phone || ""}</Text></View>
        </View>
        <View style={pdfStyles.section}>
          <View style={pdfStyles.row}><Text style={pdfStyles.label}>Tour</Text><Text style={pdfStyles.value}>{booking?.tourTitle || bookingTour(booking)?.name || ""}</Text></View>
          <View style={pdfStyles.row}><Text style={pdfStyles.label}>Travel date</Text><Text style={pdfStyles.value}>{formatDate(booking?.tripDate)}</Text></View>
          <View style={pdfStyles.row}><Text style={pdfStyles.label}>Participants</Text><Text style={pdfStyles.value}>{booking?.travelers || 1}</Text></View>
          <View style={pdfStyles.row}><Text style={pdfStyles.label}>Pickup</Text><Text style={pdfStyles.value}>{booking?.address || "Not provided"}</Text></View>
        </View>
        <View style={pdfStyles.section}>
          <View style={pdfStyles.row}><Text style={pdfStyles.label}>Booking status</Text><Text style={pdfStyles.value}>{booking?.status || "pending"}</Text></View>
          <View style={pdfStyles.row}><Text style={pdfStyles.label}>Payment status</Text><Text style={pdfStyles.value}>{booking?.paymentStatus || "pending"}</Text></View>
          <View style={pdfStyles.row}><Text style={pdfStyles.label}>Total</Text><Text style={pdfStyles.value}>{formatPrice(booking?.totalPrice)}</Text></View>
        </View>
      </Page>
    </Document>
  );
};

const TicketPDF = ({ booking }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <Text style={pdfStyles.title}>AJL Tours Ticket</Text>
      <View style={pdfStyles.section}>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>Booking ID</Text><Text style={pdfStyles.value}>{bookingId(booking)}</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>Tour</Text><Text style={pdfStyles.value}>{booking?.tourTitle || bookingTour(booking)?.name || ""}</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>Travel date</Text><Text style={pdfStyles.value}>{formatDate(booking?.tripDate)}</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>Participants</Text><Text style={pdfStyles.value}>{booking?.travelers || 1}</Text></View>
      </View>
      <View style={pdfStyles.section}>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>Guest</Text><Text style={pdfStyles.value}>{booking?.name || ""}</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>Pickup</Text><Text style={pdfStyles.value}>{booking?.address || "Not provided"}</Text></View>
        <View style={pdfStyles.row}><Text style={pdfStyles.label}>Status</Text><Text style={pdfStyles.value}>{booking?.status || "pending"}</Text></View>
      </View>
    </Page>
  </Document>
);

const DownloadPdfButton = ({ type, booking }) => {
  const { formatPrice } = useCurrency();
  const document = type === "ticket" ? <TicketPDF booking={booking} /> : <InvoicePDF booking={booking} formatPrice={formatPrice} />;
  const fileName = `ajl-${type}-${String(bookingId(booking)).slice(-8) || "booking"}.pdf`;
  return (
    <PDFDownloadLink document={document} fileName={fileName}>
      {({ loading }) => (
        <span className="inline-flex items-center gap-2 rounded-lg border border-orange-200 px-3 py-2 text-sm font-bold text-orange-700 transition hover:bg-orange-50">
          <Download className="h-4 w-4" aria-hidden="true" />
          {loading ? "Preparing" : type === "ticket" ? "Ticket" : "Invoice"}
        </span>
      )}
    </PDFDownloadLink>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="flex flex-col gap-1 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
    <span className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</span>
    <span className="break-words text-sm font-semibold text-gray-900">{value || "Not provided"}</span>
  </div>
);

const CustomerDashboard = () => {
  const { user, setUser, loading: appLoading } = useContext(AppContext);
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [overview, setOverview] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [payments, setPayments] = useState({ payments: [], summary: {} });
  const [supportTickets, setSupportTickets] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [security, setSecurity] = useState(null);
  const [filters, setFilters] = useState({
    q: "",
    status: "all",
    paymentStatus: "all",
    sort: "newest",
  });
  const filtersRef = useRef(filters);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    country: "",
    defaultPickupAddress: "",
    profileImage: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordFields, setShowPasswordFields] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [supportForm, setSupportForm] = useState({
    subject: "",
    category: "booking",
    bookingId: "",
    message: "",
  });

  const email = user?.email || "";

  const passwordRequirements = useMemo(() => {
    const password = passwordForm.newPassword;
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, [passwordForm.newPassword]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const requestCustomer = useCallback(async (path, options = {}) => {
    if (!email) throw new Error("Please log in to access your dashboard.");
    const method = options.method || "GET";
    const separator = path.includes("?") ? "&" : "?";
    const url = method === "GET"
      ? apiUrl(`/api/customer${path}${separator}email=${encodeURIComponent(email)}`)
      : apiUrl(`/api/customer${path}`);

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "GET" ? undefined : JSON.stringify({ email, ...(options.body || {}) }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || payload.message || "Request failed");
    }
    return payload.data ?? payload;
  }, [email]);

  const loadOverview = useCallback(async () => {
    const data = await requestCustomer("/overview");
    setOverview(data);
    if (data?.account?.profile) {
      setProfileForm({
        name: data.account.profile.name || "",
        phone: data.account.profile.phone || "",
        country: data.account.profile.country || "",
        defaultPickupAddress: data.account.profile.defaultPickupAddress || "",
        profileImage: data.account.profile.profileImage || "",
      });
    }
  }, [requestCustomer]);

  const loadBookings = useCallback(async () => {
    const params = new URLSearchParams();
    Object.entries(filtersRef.current).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const data = await requestCustomer(`/bookings?${params.toString()}`);
    const list = Array.isArray(data) ? data : [];
    setBookings(list);
    setSelectedBooking((current) => {
      if (!current) return list[0] || null;
      const currentId = String(bookingId(current));
      return list.some((item) => String(bookingId(item)) === currentId) ? current : list[0] || null;
    });
  }, [requestCustomer]);

  const loadNotifications = useCallback(async () => {
    const data = await requestCustomer("/notifications");
    setNotifications(Array.isArray(data) ? data : []);
  }, [requestCustomer]);

  const loadPayments = useCallback(async () => {
    const data = await requestCustomer("/payments");
    setPayments(data || { payments: [], summary: {} });
  }, [requestCustomer]);

  const loadSupportTickets = useCallback(async () => {
    const data = await requestCustomer("/support-tickets");
    setSupportTickets(Array.isArray(data) ? data : []);
  }, [requestCustomer]);

  const loadWishlist = useCallback(async () => {
    const data = await requestCustomer("/wishlist");
    const serverItems = Array.isArray(data) ? data : [];
    const localFavorites = JSON.parse(localStorage.getItem(`favorites_${email}`) || "[]");
    const merged = new Map();

    serverItems.forEach((item) => {
      const id = item.tour?.id || item.tour?._id;
      if (id) merged.set(String(id), item);
    });
    localFavorites.forEach((tour) => {
      const id = getTourId(tour) || tour.id || tour._id;
      if (id && !merged.has(String(id))) {
        merged.set(String(id), {
          id: `local-${id}`,
          isLocal: true,
          savedAt: null,
          tour: { ...tour, id, _id: id },
        });
      }
    });

    setWishlist(Array.from(merged.values()));
  }, [email, requestCustomer]);

  const loadSecurity = useCallback(async () => {
    const data = await requestCustomer("/security");
    setSecurity(data);
  }, [requestCustomer]);

  const refreshAll = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      await Promise.all([
        loadOverview(),
        loadBookings(),
        loadNotifications(),
        loadPayments(),
        loadSupportTickets(),
        loadWishlist(),
        loadSecurity(),
      ]);
    } catch (err) {
      setError(err.message || "Could not load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [email, loadBookings, loadNotifications, loadOverview, loadPayments, loadSecurity, loadSupportTickets, loadWishlist]);

  useEffect(() => {
    if (!appLoading && !user) {
      navigate("/login");
    }
  }, [appLoading, navigate, user]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const selectedDetail = selectedBooking || bookings[0] || null;

  const stats = useMemo(() => overview?.stats || {}, [overview]);

  const canCancel = (booking) => {
    if (!booking) return false;
    if (["cancelled", "completed"].includes(String(booking.status || "").toLowerCase())) return false;
    if (!booking.tripDate) return true;
    return new Date(booking.tripDate) > new Date();
  };

  const rebook = (booking) => {
    const tour = bookingTour(booking);
    const id = tourIdFromBooking(booking);
    if (!id || typeof id === "object") return;
    const destination = String(tour?.metadata?.destination || tour?.divisionName || "").toLowerCase().includes("sri")
      ? "srilanka"
      : "switzerland";
    navigate(`/${destination}/${id}/checkout-sw`, { state: { tour } });
  };

  const handleCancelBooking = async (booking) => {
    if (!canCancel(booking)) return;
    const confirmed = window.confirm("Cancel this booking?");
    if (!confirmed) return;
    const reason = window.prompt("Reason for cancellation (optional)") || "";
    setActionLoading(`cancel-${bookingId(booking)}`);
    setError("");
    setSuccess("");
    try {
      const updated = await requestCustomer(`/bookings/${bookingId(booking)}/cancel`, {
        method: "PUT",
        body: { reason },
      });
      setSuccess(updated?.message || "Booking cancelled.");
      await Promise.all([loadBookings(), loadOverview(), loadNotifications(), loadPayments()]);
    } catch (err) {
      setError(err.message || "Could not cancel booking.");
    } finally {
      setActionLoading("");
    }
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setActionLoading("profile");
    setError("");
    setSuccess("");
    try {
      const updated = await requestCustomer("/profile", {
        method: "PUT",
        body: profileForm,
      });
      setUser(updated);
      localStorage.setItem("currentUser", JSON.stringify(updated));
      setSuccess("Profile updated successfully.");
      await loadOverview();
    } catch (err) {
      setError(err.message || "Could not update profile.");
    } finally {
      setActionLoading("");
    }
  };

  const handleProfileImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Profile image must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfileForm((current) => ({ ...current, profileImage: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (!Object.values(passwordRequirements).every(Boolean)) {
      setError("New password must meet all requirements.");
      return;
    }
    setActionLoading("password");
    setError("");
    setSuccess("");
    try {
      await requestCustomer("/profile/password", {
        method: "PUT",
        body: {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSuccess("Password changed successfully.");
      await loadSecurity();
    } catch (err) {
      setError(err.message || "Could not change password.");
    } finally {
      setActionLoading("");
    }
  };

  const markNotificationRead = async (id) => {
    setActionLoading(`notification-${id}`);
    try {
      await requestCustomer(`/notifications/${id}/read`, { method: "PATCH" });
      await Promise.all([loadNotifications(), loadOverview()]);
    } catch (err) {
      setError(err.message || "Could not update notification.");
    } finally {
      setActionLoading("");
    }
  };

  const markAllNotificationsRead = async () => {
    setActionLoading("notifications");
    try {
      await requestCustomer("/notifications/read-all", { method: "PATCH" });
      await Promise.all([loadNotifications(), loadOverview()]);
    } catch (err) {
      setError(err.message || "Could not update notifications.");
    } finally {
      setActionLoading("");
    }
  };

  const handleSupportSubmit = async (event) => {
    event.preventDefault();
    setActionLoading("support");
    setError("");
    setSuccess("");
    try {
      await requestCustomer("/support-tickets", {
        method: "POST",
        body: supportForm,
      });
      setSupportForm({ subject: "", category: "booking", bookingId: "", message: "" });
      setSuccess("Support ticket created.");
      await Promise.all([loadSupportTickets(), loadOverview(), loadNotifications()]);
    } catch (err) {
      setError(err.message || "Could not create support ticket.");
    } finally {
      setActionLoading("");
    }
  };

  const syncLocalWishlist = (tour, remove = false) => {
    const key = `favorites_${email}`;
    const current = JSON.parse(localStorage.getItem(key) || "[]");
    const id = getTourId(tour) || tour?.id || tour?._id;
    if (!id) return;
    const next = remove
      ? current.filter((item) => String(getTourId(item) || item.id || item._id) !== String(id))
      : [
          ...current.filter((item) => String(getTourId(item) || item.id || item._id) !== String(id)),
          { ...tour, id, _id: id },
        ];
    localStorage.setItem(key, JSON.stringify(next));
  };

  const removeWishlistItem = async (item) => {
    const tour = item.tour || {};
    const id = tour.id || tour._id;
    if (!id) return;
    setActionLoading(`wishlist-${id}`);
    setError("");
    setSuccess("");
    try {
      if (!item.isLocal) {
        await requestCustomer(`/wishlist/${id}`, { method: "DELETE" });
      }
      syncLocalWishlist(tour, true);
      setSuccess("Tour removed from wishlist.");
      await loadWishlist();
    } catch (err) {
      setError(err.message || "Could not remove tour.");
    } finally {
      setActionLoading("");
    }
  };

  const applyBookingFilters = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await loadBookings();
    } catch (err) {
      setError(err.message || "Could not load bookings.");
    } finally {
      setLoading(false);
    }
  };

  if (appLoading || (!user && !appLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-orange-600" />
          <p className="mt-4 font-semibold text-gray-700">Loading account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-orange-600">Customer Account</p>
              <h1 className="mt-1 text-3xl font-bold text-gray-900">Welcome, {user?.name || "AJL guest"}</h1>
              <p className="mt-1 text-sm text-gray-600">{email}</p>
            </div>
            <button
              onClick={refreshAll}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:border-orange-300 hover:text-orange-700 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
              Refresh
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition ${
                    active
                      ? "bg-orange-600 text-white shadow"
                      : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-orange-50 hover:text-orange-700"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {(error || success) && (
          <div className={`mb-5 flex items-start gap-3 rounded-lg border p-4 text-sm font-semibold ${
            error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"
          }`}>
            {error ? <AlertCircle className="mt-0.5 h-5 w-5" /> : <CheckCircle className="mt-0.5 h-5 w-5" />}
            <span>{error || success}</span>
          </div>
        )}

        {activeTab === "overview" && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <StatCard icon={Ticket} label="Total bookings" value={stats.totalBookings || 0} />
              <StatCard icon={CreditCard} label="Total spent" value={formatPrice(stats.totalSpent || 0)} />
              <StatCard icon={Clock} label="Pending payments" value={stats.pendingPayments || 0} />
              <StatCard icon={CalendarDays} label="Upcoming" value={stats.upcomingBookings || 0} />
              <StatCard icon={Shield} label="Account status" value={overview?.account?.status || "Active"} />
              <StatCard icon={Bell} label="Unread alerts" value={stats.unreadNotifications || 0} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <DashboardPanel title="Upcoming bookings">
                {overview?.upcomingBookings?.length ? (
                  <BookingList bookings={overview.upcomingBookings} onSelect={(booking) => { setSelectedBooking(booking); setActiveTab("details"); }} />
                ) : (
                  <EmptyState icon={CalendarDays} title="No upcoming bookings" text="Confirmed future bookings will appear here." />
                )}
              </DashboardPanel>
              <DashboardPanel title="Recent notifications">
                {overview?.recentNotifications?.length ? (
                  <NotificationList
                    notifications={overview.recentNotifications}
                    onRead={markNotificationRead}
                    actionLoading={actionLoading}
                  />
                ) : (
                  <EmptyState icon={Bell} title="No notifications" text="Booking, payment, support, and account updates will appear here." />
                )}
              </DashboardPanel>
            </div>

            <DashboardPanel title="Recent bookings">
              {overview?.recentBookings?.length ? (
                <BookingList bookings={overview.recentBookings} onSelect={(booking) => { setSelectedBooking(booking); setActiveTab("details"); }} />
              ) : (
                <EmptyState
                  icon={Ticket}
                  title="No bookings yet"
                  text="Your completed checkout bookings will be listed here."
                  action={<Link to="/tours" className="mt-4 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700">Explore tours</Link>}
                />
              )}
            </DashboardPanel>
          </section>
        )}

        {activeTab === "bookings" && (
          <section className="space-y-5">
            <DashboardPanel title="My bookings">
              <form onSubmit={applyBookingFilters} className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr_auto] lg:items-end">
                <label className="block">
                  <span className="mb-1 block text-sm font-bold text-gray-700">Search bookings</span>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      value={filters.q}
                      onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
                      className="h-11 w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      placeholder="Search tour, pickup, payment ID"
                    />
                  </div>
                </label>
                <Select value={filters.status} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} label="Booking status">
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
                <Select value={filters.paymentStatus} onChange={(value) => setFilters((current) => ({ ...current, paymentStatus: value }))} label="Payment status">
                  <option value="all">All payments</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </Select>
                <Select value={filters.sort} onChange={(value) => setFilters((current) => ({ ...current, sort: value }))} label="Sort bookings">
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="travelDateAsc">Travel date ascending</option>
                  <option value="travelDateDesc">Travel date descending</option>
                  <option value="amountHigh">Amount high to low</option>
                  <option value="amountLow">Amount low to high</option>
                </Select>
                <button className="h-11 rounded-lg bg-orange-600 px-5 text-sm font-bold text-white hover:bg-orange-700" type="submit">
                  Apply
                </button>
              </form>
              {bookings.length ? (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <BookingCard
                      key={bookingId(booking)}
                      booking={booking}
                      onDetails={() => { setSelectedBooking(booking); setActiveTab("details"); }}
                      onCancel={() => handleCancelBooking(booking)}
                      onRebook={() => rebook(booking)}
                      canCancel={canCancel(booking)}
                      actionLoading={actionLoading}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState icon={Ticket} title="No bookings found" text="Try adjusting your search or filter selection." />
              )}
            </DashboardPanel>
          </section>
        )}

        {activeTab === "details" && (
          <BookingDetails booking={selectedDetail} onRebook={() => rebook(selectedDetail)} />
        )}

        {activeTab === "profile" && (
          <DashboardPanel title="Profile management">
            <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
              <div className="flex flex-col items-center gap-4">
                <div className="h-32 w-32 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                  {profileForm.profileImage ? (
                    <img src={profileForm.profileImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User className="h-12 w-12 text-gray-400" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <label className="w-full cursor-pointer rounded-lg border border-orange-200 px-3 py-2 text-center text-sm font-bold text-orange-700 hover:bg-orange-50">
                  Upload image
                  <input type="file" accept="image/*" onChange={handleProfileImage} className="sr-only" />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextInput label="Full name" value={profileForm.name} onChange={(value) => setProfileForm((current) => ({ ...current, name: value }))} required />
                <TextInput label="Email" value={email} readOnly />
                <TextInput label="Phone" value={profileForm.phone} onChange={(value) => setProfileForm((current) => ({ ...current, phone: value }))} />
                <TextInput label="Country" value={profileForm.country} onChange={(value) => setProfileForm((current) => ({ ...current, country: value }))} />
                <label className="md:col-span-2">
                  <span className="mb-1 block text-sm font-bold text-gray-700">Default pickup address</span>
                  <textarea
                    value={profileForm.defaultPickupAddress}
                    onChange={(event) => setProfileForm((current) => ({ ...current, defaultPickupAddress: event.target.value }))}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </label>
                <div className="md:col-span-2">
                  <button disabled={actionLoading === "profile"} className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-60">
                    {actionLoading === "profile" ? "Saving..." : "Save profile"}
                  </button>
                </div>
              </div>
            </form>
          </DashboardPanel>
        )}

        {activeTab === "notifications" && (
          <DashboardPanel
            title="Notifications"
            action={notifications.length ? (
              <button onClick={markAllNotificationsRead} disabled={actionLoading === "notifications"} className="rounded-lg border border-orange-200 px-3 py-2 text-sm font-bold text-orange-700 hover:bg-orange-50 disabled:opacity-60">
                Mark all as read
              </button>
            ) : null}
          >
            {notifications.length ? (
              <NotificationList notifications={notifications} onRead={markNotificationRead} actionLoading={actionLoading} />
            ) : (
              <EmptyState icon={Bell} title="No notifications" text="Your account notification center is clear." />
            )}
          </DashboardPanel>
        )}

        {activeTab === "payments" && (
          <DashboardPanel title="Payments and invoices">
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-4">
              <StatCard icon={CreditCard} label="Paid bookings" value={payments.summary?.paid || 0} />
              <StatCard icon={Clock} label="Pending" value={payments.summary?.pending || 0} />
              <StatCard icon={RefreshCw} label="Refunded" value={payments.summary?.refunded || 0} />
              <StatCard icon={CheckCircle} label="Total paid" value={formatPrice(payments.summary?.totalPaid || 0)} />
            </div>
            {payments.payments?.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Tour</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Refund</TableHead>
                      <TableHead>Download</TableHead>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {payments.payments.map((payment) => {
                      const booking = bookings.find((item) => String(bookingId(item)) === String(payment.bookingId));
                      return (
                        <tr key={payment.id}>
                          <TableCell>{payment.invoiceNumber}</TableCell>
                          <TableCell>{payment.tourTitle}</TableCell>
                          <TableCell>{formatPrice(payment.amount)}</TableCell>
                          <TableCell><StatusBadge value={payment.paymentStatus} /></TableCell>
                          <TableCell>{payment.refundStatus}</TableCell>
                          <TableCell>{booking ? <DownloadPdfButton type="invoice" booking={booking} /> : "Unavailable"}</TableCell>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={CreditCard} title="No payment history" text="Payments appear here after checkout." />
            )}
          </DashboardPanel>
        )}

        {activeTab === "support" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
            <DashboardPanel title="Create support ticket">
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <TextInput label="Subject" value={supportForm.subject} onChange={(value) => setSupportForm((current) => ({ ...current, subject: value }))} required />
                <Select value={supportForm.category} onChange={(value) => setSupportForm((current) => ({ ...current, category: value }))} label="Category">
                  <option value="booking">Booking</option>
                  <option value="payment">Payment</option>
                  <option value="tour">Tour</option>
                  <option value="account">Account</option>
                  <option value="refund">Refund</option>
                  <option value="other">Other</option>
                </Select>
                <Select value={supportForm.bookingId} onChange={(value) => setSupportForm((current) => ({ ...current, bookingId: value }))} label="Related booking">
                  <option value="">No booking selected</option>
                  {bookings.map((booking) => (
                    <option key={bookingId(booking)} value={bookingId(booking)}>
                      {booking.tourTitle} - {formatDate(booking.tripDate)}
                    </option>
                  ))}
                </Select>
                <label>
                  <span className="mb-1 block text-sm font-bold text-gray-700">Message</span>
                  <textarea
                    value={supportForm.message}
                    onChange={(event) => setSupportForm((current) => ({ ...current, message: event.target.value }))}
                    rows={6}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </label>
                <button disabled={actionLoading === "support"} className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-60">
                  {actionLoading === "support" ? "Creating..." : "Create ticket"}
                </button>
              </form>
            </DashboardPanel>
            <DashboardPanel title="Ticket history">
              {supportTickets.length ? (
                <div className="space-y-3">
                  {supportTickets.map((ticketItem) => (
                    <div key={ticketItem._id || ticketItem.id} className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-bold text-gray-900">{ticketItem.subject}</p>
                          <p className="mt-1 text-sm text-gray-600">{ticketItem.ticketNumber}</p>
                        </div>
                        <StatusBadge value={ticketItem.status} />
                      </div>
                      <p className="mt-3 line-clamp-3 text-sm text-gray-600">{ticketItem.message}</p>
                      <p className="mt-3 text-xs font-semibold text-gray-500">{formatDateTime(ticketItem.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={HelpCircle} title="No support tickets" text="Tickets you create will appear here." />
              )}
            </DashboardPanel>
          </div>
        )}

        {activeTab === "wishlist" && (
          <DashboardPanel title="Wishlist">
            {wishlist.length ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {wishlist.map((item) => {
                  const tour = item.tour || {};
                  const id = tour.id || tour._id;
                  const image = Array.isArray(tour.images) ? tour.images.find(Boolean) : null;
                  return (
                    <div key={item.id || id} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                      <div className="aspect-[16/9] bg-gray-100">
                        {image ? (
                          <img src={image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <MapPin className="h-9 w-9 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="line-clamp-2 font-bold text-gray-900">{tour.name || "Saved tour"}</h3>
                        <p className="mt-2 text-sm text-gray-600">{formatPrice(tour.price)}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button onClick={() => id && navigate(`/switzerland/${id}/checkout-sw`, { state: { tour } })} className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-bold text-white hover:bg-orange-700">
                            View tour
                          </button>
                          <button onClick={() => removeWishlistItem(item)} disabled={actionLoading === `wishlist-${id}`} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Heart}
                title="No saved tours"
                text="Tours saved from this dashboard or your existing favorites will appear here."
                action={<Link to="/tours" className="mt-4 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700">Explore tours</Link>}
              />
            )}
          </DashboardPanel>
        )}

        {activeTab === "security" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashboardPanel title="Change password">
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <PasswordInput
                  label="Current password"
                  value={passwordForm.currentPassword}
                  onChange={(value) => setPasswordForm((current) => ({ ...current, currentPassword: value }))}
                  visible={showPasswordFields.current}
                  onToggle={() => setShowPasswordFields((current) => ({ ...current, current: !current.current }))}
                  autoComplete="current-password"
                />
                <div>
                  <PasswordInput
                    label="New password"
                    value={passwordForm.newPassword}
                    onChange={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))}
                    visible={showPasswordFields.next}
                    onToggle={() => setShowPasswordFields((current) => ({ ...current, next: !current.next }))}
                    autoComplete="new-password"
                  />
                  <PasswordRequirementList requirements={passwordRequirements} />
                </div>
                <PasswordInput
                  label="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(value) => setPasswordForm((current) => ({ ...current, confirmPassword: value }))}
                  visible={showPasswordFields.confirm}
                  onToggle={() => setShowPasswordFields((current) => ({ ...current, confirm: !current.confirm }))}
                  autoComplete="new-password"
                />
                <button disabled={actionLoading === "password"} className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-60">
                  {actionLoading === "password" ? "Changing..." : "Change password"}
                </button>
              </form>
            </DashboardPanel>
            <DashboardPanel title="Security activity">
              <div className="space-y-4">
                <DetailRow label="Account status" value={security?.accountStatus || overview?.account?.status || "Active"} />
                <DetailRow label="Password changed" value={formatDateTime(security?.passwordChangedAt)} />
                <DetailRow label="Last login" value={formatDateTime(security?.lastLoginAt)} />
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Active session</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">This browser</p>
                </div>
                <div>
                  <p className="mb-2 text-sm font-bold text-gray-700">Login activity</p>
                  {security?.loginActivity?.length ? (
                    <div className="space-y-2">
                      {security.loginActivity.map((item, index) => (
                        <div key={`${item.occurredAt}-${index}`} className="rounded-lg border border-gray-200 bg-white p-3">
                          <p className="text-sm font-bold text-gray-900">{formatDateTime(item.occurredAt)}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-gray-500">{item.userAgent || "Browser details unavailable"}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-600">Login history begins with your next successful login.</p>
                  )}
                </div>
              </div>
            </DashboardPanel>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
    </div>
  </div>
);

const DashboardPanel = ({ title, action, children }) => (
  <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const BookingList = ({ bookings, onSelect }) => (
  <div className="space-y-3">
    {bookings.map((booking) => (
      <button
        key={bookingId(booking)}
        type="button"
        onClick={() => onSelect(booking)}
        className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-orange-200 hover:bg-orange-50"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-bold text-gray-900">{booking.tourTitle || bookingTour(booking)?.name || "AJL Tour"}</p>
            <p className="mt-1 text-sm text-gray-600">{formatDate(booking.tripDate)} - {booking.travelers || 1} participant{Number(booking.travelers || 1) === 1 ? "" : "s"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={booking.status} />
            <StatusBadge value={booking.paymentStatus} />
          </div>
        </div>
      </button>
    ))}
  </div>
);

const BookingCard = ({ booking, onDetails, onCancel, onRebook, canCancel, actionLoading }) => {
  const id = bookingId(booking);
  const { formatPrice } = useCurrency();
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-lg font-bold text-gray-900">{booking.tourTitle || bookingTour(booking)?.name || "AJL Tour"}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {formatDate(booking.tripDate)}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {booking.address || "Pickup not set"}</span>
            <span>{formatPrice(booking.totalPrice)}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge value={booking.status} />
            <StatusBadge value={booking.paymentStatus} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onDetails} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
            <Eye className="h-4 w-4" /> Details
          </button>
          <DownloadPdfButton type="invoice" booking={booking} />
          <DownloadPdfButton type="ticket" booking={booking} />
          {String(booking.status).toLowerCase() === "completed" && (
            <button onClick={onRebook} className="rounded-lg border border-orange-200 px-3 py-2 text-sm font-bold text-orange-700 hover:bg-orange-50">
              Rebook
            </button>
          )}
          {canCancel && (
            <button
              onClick={onCancel}
              disabled={actionLoading === `cancel-${id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" /> {actionLoading === `cancel-${id}` ? "Cancelling" : "Cancel"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const BookingDetails = ({ booking, onRebook }) => {
  const { formatPrice } = useCurrency();

  if (!booking) {
    return <EmptyState icon={Ticket} title="No booking selected" text="Select a booking to view its details." />;
  }

  const tour = bookingTour(booking);
  return (
    <DashboardPanel
      title="Booking details"
      action={<div className="flex flex-wrap gap-2"><DownloadPdfButton type="invoice" booking={booking} /><DownloadPdfButton type="ticket" booking={booking} /></div>}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">{booking.tourTitle || tour?.name || "AJL Tour"}</p>
          <p className="mt-1 text-sm text-gray-500">Booking ID: {bookingId(booking)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge value={booking.status} />
          <StatusBadge value={booking.paymentStatus} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DetailRow label="Tour information" value={tour?.name || booking.tourTitle} />
        <DetailRow label="Travel date" value={formatDate(booking.tripDate)} />
        <DetailRow label="Participants" value={booking.travelers} />
        <DetailRow label="Pickup information" value={booking.address} />
        <DetailRow label="Booking status" value={booking.status} />
        <DetailRow label="Payment status" value={booking.paymentStatus} />
        <DetailRow label="Invoice number" value={`AJL-${String(bookingId(booking)).slice(-8).toUpperCase()}`} />
        <DetailRow label="Payment reference" value={booking.stripePaymentId} />
        <DetailRow label="Total" value={formatPrice(booking.totalPrice)} />
        <DetailRow label="Start location" value={tour?.startLocation} />
        <DetailRow label="End location" value={tour?.endLocation} />
        <DetailRow label="Special requests" value={booking.specialRequests} />
      </div>
      {String(booking.status).toLowerCase() === "completed" && (
        <button onClick={onRebook} className="mt-5 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-700">
          Rebook this tour
        </button>
      )}
    </DashboardPanel>
  );
};

const NotificationList = ({ notifications, onRead, actionLoading }) => (
  <div className="space-y-3">
    {notifications.map((notification) => (
      <div key={notification._id || notification.id} className={`rounded-lg border p-4 ${notification.isRead ? "border-gray-200 bg-white" : "border-orange-200 bg-orange-50"}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-bold text-gray-900">{notification.title}</p>
            <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
            <p className="mt-2 text-xs font-semibold text-gray-500">{formatDateTime(notification.createdAt)}</p>
          </div>
          {!notification.isRead && (
            <button
              onClick={() => onRead(notification._id || notification.id)}
              disabled={actionLoading === `notification-${notification._id || notification.id}`}
              className="rounded-lg border border-orange-200 px-3 py-2 text-sm font-bold text-orange-700 hover:bg-white disabled:opacity-60"
            >
              Mark read
            </button>
          )}
        </div>
      </div>
    ))}
  </div>
);

const Select = ({ label, value, onChange, children }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-bold text-gray-700">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
    >
      {children}
    </select>
  </label>
);

const TextInput = ({ label, value, onChange, required, readOnly }) => (
  <label>
    <span className="mb-1 block text-sm font-bold text-gray-700">{label}</span>
    <input
      value={value}
      required={required}
      readOnly={readOnly}
      onChange={(event) => onChange?.(event.target.value)}
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100 ${readOnly ? "bg-gray-100 text-gray-500" : ""}`}
    />
  </label>
);

const PasswordInput = ({ label, value, onChange, visible, onToggle, autoComplete }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-bold text-gray-700">{label}</span>
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type={visible ? "text" : "password"}
        value={value}
        required
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-gray-300 py-2 pl-9 pr-11 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-100"
        aria-label={visible ? `Hide ${label}` : `Show ${label}`}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  </label>
);

const passwordRequirementLabels = [
  { key: "length", label: "At least 8 characters" },
  { key: "uppercase", label: "One uppercase letter" },
  { key: "lowercase", label: "One lowercase letter" },
  { key: "number", label: "One number" },
  { key: "special", label: "One special character" },
];

const PasswordRequirementList = ({ requirements }) => (
  <div className="mt-3 rounded-lg bg-gray-50 p-4">
    <p className="mb-3 text-sm font-bold text-gray-700">Password requirements</p>
    <div className="space-y-2">
      {passwordRequirementLabels.map((item) => {
        const isMet = Boolean(requirements[item.key]);
        return (
          <div key={item.key} className={`flex items-center gap-2 text-sm font-semibold ${isMet ? "text-green-600" : "text-gray-500"}`}>
            {isMet ? (
              <CheckCircle className="h-4 w-4 shrink-0" />
            ) : (
              <span className="h-4 w-4 shrink-0 rounded-full bg-gray-300" aria-hidden="true" />
            )}
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  </div>
);

const TableHead = ({ children }) => (
  <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500">{children}</th>
);

const TableCell = ({ children }) => (
  <td className="px-4 py-3 align-top text-sm text-gray-700">{children}</td>
);

export default CustomerDashboard;
