import React, { useState, useContext, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import Button from "../components/Button";
import { AppContext } from "../context/AppContext";
import { GoogleMap, Marker, useLoadScript, Autocomplete } from "@react-google-maps/api";
import { useCurrency } from "../context/CurrencyContext";

const GOOGLE_MAPS_API_KEY = "AIzaSyBIsqW3BgowXGN6qM4RTiPdMi2a-9MT-Xs";
const mapContainerStyle = { width: "100%", height: "300px" };
const center = { lat: 28.6139, lng: 77.2090 }; // Default to Delhi

const Booking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, addBooking } = useContext(AppContext);
  const tour = location.state?.tour;
  const { symbol, rate } = useCurrency();

  if (!tour || !user) {
    return navigate("/login");
  }

  const { title, price } = tour;
  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    travelers: 1,
    specialRequests: "",
    tripDate: today,
    address: "",
    lat: null,
    lng: null,
  });
  const [totalPrice, setTotalPrice] = useState(price);
  const [autocomplete, setAutocomplete] = useState(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.formatted_address && place.geometry) {
        setFormData((prev) => ({
          ...prev,
          address: place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        }));
      }
    }
  };

  const onMapClick = useCallback((e) => {
    setFormData((prev) => ({
      ...prev,
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
      address: "", // Clear address if pin is moved manually
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.tripDate) {
      toast.error("Please fill out all required fields.");
      return;
    }
    if (!formData.address && (formData.lat === null || formData.lng === null)) {
      toast.error("Please select your starting location (address or map pin).");
      return;
    }
    const booking = { ...formData, tourTitle: title, totalPrice };
    try {
      await addBooking(booking);
    toast.success("Booking successful!");
    navigate("/invoice", { state: { booking } });
    } catch (err) {
      toast.error("Booking failed: " + (err.response?.data?.message || err.message));
    }
  };

  React.useEffect(() => {
    setTotalPrice((price * parseInt(formData.travelers, 10) * rate).toFixed(2));
  }, [formData.travelers, price, tour, rate]);

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      className="max-w-4xl mx-auto p-6 bg-white/20 rounded-lg  shadow-lg"
      variants={formVariants}
      initial="hidden"
      animate="visible"
    >
      <h2 className="text-3xl font-bold mb-6">Book Your Tour: {title}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-lg font-semibold">Address (Start Location)</label>
          {isLoaded && (
            <Autocomplete
              onLoad={setAutocomplete}
              onPlaceChanged={onPlaceChanged}
            >
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg bg-inherit"
                placeholder="Type your address or select on map"
              />
            </Autocomplete>
          )}
        </div>
        <div>
          <label className="block text-lg font-semibold">Or Pin Your Location on Map</label>
          {isLoaded && (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={formData.lat && formData.lng ? { lat: formData.lat, lng: formData.lng } : center}
              zoom={formData.lat && formData.lng ? 14 : 5}
              onClick={onMapClick}
            >
              {formData.lat && formData.lng && (
                <Marker position={{ lat: formData.lat, lng: formData.lng }} />
              )}
            </GoogleMap>
          )}
        </div>
        <div>
          <label className="block text-lg font-semibold">Name</label>
          <motion.input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg bg-inherit"
            required
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div>
          <label className="block text-lg font-semibold">Email</label>
          <motion.input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg bg-inherit"
            required
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div>
          <label className="block text-lg font-semibold">Phone Number</label>
          <motion.input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg bg-inherit"
            required
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div>
          <label className="block text-lg font-semibold">
            Number of Travelers
          </label>
          <motion.input
            type="number"
            name="travelers"
            min="1"
            value={formData.travelers}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg bg-inherit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div>
          <label className="block text-lg font-semibold">Trip Date</label>
          <motion.input
            type="date"
            name="tripDate"
            value={formData.tripDate}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg bg-inherit"
            min={today}
            required
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div>
          <label className="block text-lg font-semibold">
            Special Requests (Optional)
          </label>
          <motion.textarea
            name="specialRequests"
            value={formData.specialRequests}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg bg-inherit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Total Price: {symbol}{totalPrice}</h3>
        </div>
        <Button
          type="submit"
          className="button-31"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Confirm Booking
        </Button>
      </form>
    </motion.div>
  );
};

export default Booking;
