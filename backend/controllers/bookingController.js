const Booking = require('../models/Booking');
const HomepageContent = require('../models/HomepageContent');

async function createBooking(req, res) {
  try {
    const { name, email, phone, travelers, specialRequests, tourTitle, totalPrice, tripDate, address, lat, lng, tourId } = req.body || {};

    // Optional: enforce limits from settings
    try {
      const settings = await HomepageContent.findOne({ section: 'checkout_settings' });
      if (settings && settings.content) {
        const key = tourId || 'unknown';
        const cfg = settings.content[key] || {};
        const minTickets = Number.isFinite(cfg.minTickets) ? cfg.minTickets : 1;
        if (Number(travelers) < minTickets) {
          return res.status(400).json({ message: `Minimum tickets per booking is ${minTickets}` });
        }
      }
    } catch (_) {}

    const booking = new Booking({
      name,
      email,
      phone,
      travelers,
      specialRequests,
      tourTitle,
      tourId,
      totalPrice,
      tripDate: new Date(tripDate),
      address,
      location: { lat, lng }
    });
    await booking.save();
    return res.status(201).json(booking);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getAllBookings(req, res) {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    return res.json(bookings);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateBookingStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const updated = await Booking.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Booking not found' });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getBookingStats(req, res) {
  try {
    const { data: bookings, error } = await Booking.find({});
    if (error) throw error;
    
    const stats = bookings.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});
    
    const formattedStats = Object.entries(stats).map(([_id, count]) => ({ _id, count }));
    
    return res.json(formattedStats);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  createBooking,
  getAllBookings,
  updateBookingStatus,
  getBookingStats,
};
