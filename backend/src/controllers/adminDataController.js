const Admin = require('../../models/Admin');
const Booking = require('../../models/Booking');
const Division = require('../../models/Division');
const Tour = require('../../models/Tour');
const User = require('../../models/User');
const { AppError } = require('../middleware/errorHandler');
const tourService = require('../services/tourService');

const ORDER_SELECT = [
  'name',
  'email',
  'phone',
  'address',
  'tourTitle',
  'tourId',
  'user',
  'travelers',
  'totalPrice',
  'unitPrice',
  'originalUnitPrice',
  'discountUnitPrice',
  'groupDiscountTier',
  'groupDiscountUnitAmount',
  'groupDiscountTotal',
  'groupDiscountPercent',
  'paymentCurrency',
  'tripDate',
  'specialRequests',
  'status',
  'paymentStatus',
  'stripePaymentId',
  'createdAt',
  'updatedAt',
  'cancelledAt',
  'cancelledBy',
].join(' ');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const bookingId = (booking) => booking?._id?.toString?.() || String(booking?._id || booking?.id || '');

const getMonthRange = (month) => {
  const value = String(month || '').trim();
  if (!/^\d{4}-\d{2}$/.test(value)) return null;
  const [year, monthIndex] = value.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthIndex - 1, 1));
  const end = new Date(Date.UTC(year, monthIndex, 1));
  return { $gte: start, $lt: end };
};

const normalizeDivision = (division) => ({
  id: division._id?.toString?.() || division.id,
  _id: division._id?.toString?.() || division.id,
  name: division.name || '',
  slug: division.slug || '',
  description: division.description || '',
  bannerImage: division.bannerImage || '',
  banner_image: division.bannerImage || '',
  isActive: division.isActive !== false,
  createdAt: division.createdAt,
  updatedAt: division.updatedAt,
});

const normalizeUser = (user, bookingCounts = {}) => {
  const id = user._id?.toString?.() || user.id;
  const email = String(user.email || '').toLowerCase();
  return {
    id,
    _id: id,
    name: user.name || '',
    email,
    phone: user.phone || '',
    country: user.country || '',
    defaultPickupAddress: user.defaultPickupAddress || '',
    isActive: user.isActive !== false,
    role: user.role || 'user',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
    totalBookings: bookingCounts[email] || 0,
  };
};

const normalizeBooking = (booking) => {
  const id = bookingId(booking);
  const populatedUser = booking.user && typeof booking.user === 'object' ? booking.user : null;
  const populatedTour = booking.tourId && typeof booking.tourId === 'object' ? booking.tourId : null;
  const amount = Number(booking.totalPrice);
  const travelers = Number(booking.travelers);
  const customerName = booking.name || populatedUser?.name || 'Guest customer';
  const customerEmail = booking.email || populatedUser?.email || '';
  const tourName = booking.tourTitle || populatedTour?.name || 'Tour';

  return {
    id,
    _id: id,
    userId: populatedUser?._id?.toString?.() || booking.user?.toString?.() || '',
    customerName,
    name: customerName,
    email: customerEmail,
    phone: booking.phone || populatedUser?.phone || '',
    address: booking.address || '',
    tourId: populatedTour?._id?.toString?.() || booking.tourId?.toString?.() || '',
    tourName,
    tourTitle: tourName,
    travelDate: booking.tripDate,
    tripDate: booking.tripDate,
    travelers: Number.isFinite(travelers) && travelers > 0 ? travelers : 1,
    unitPrice: Number(booking.unitPrice || 0),
    originalUnitPrice: Number(booking.originalUnitPrice || 0),
    discountUnitPrice: Number(booking.discountUnitPrice || 0),
    groupDiscountTier: booking.groupDiscountTier || null,
    groupDiscountUnitAmount: Number(booking.groupDiscountUnitAmount || 0),
    groupDiscountTotal: Number(booking.groupDiscountTotal || 0),
    groupDiscountPercent: Number(booking.groupDiscountPercent || 0),
    totalPrice: Number.isFinite(amount) ? amount : 0,
    totalAmount: Number.isFinite(amount) ? amount : 0,
    currency: booking.paymentCurrency || 'CHF',
    paymentCurrency: booking.paymentCurrency || 'CHF',
    bookingDate: booking.createdAt,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    status: String(booking.status || 'pending').toLowerCase(),
    paymentStatus: String(booking.paymentStatus || 'pending').toLowerCase(),
    specialRequests: booking.specialRequests || '',
    stripePaymentId: booking.stripePaymentId || '',
    customerRegistrationDate: populatedUser?.createdAt || null,
  };
};

const getBookingQuery = (query = {}) => {
  const filters = {};
  const status = String(query.status || '').trim().toLowerCase();
  const q = String(query.q || query.search || '').trim();
  const tourId = String(query.tourId || '').trim();
  const monthRange = getMonthRange(query.month);

  if (status && status !== 'all') filters.status = status;
  if (tourId && tourId !== 'all') filters.tourId = tourId;
  if (monthRange) filters.tripDate = monthRange;
  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    filters.$or = [
      { name: regex },
      { email: regex },
      { phone: regex },
      { tourTitle: regex },
      { address: regex },
      { specialRequests: regex },
    ];
  }

  return filters;
};

const getBookingStats = async () => {
  const [statusCounts, revenueResult] = await Promise.all([
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: null, totalRevenue: { $sum: { $ifNull: ['$totalPrice', 0] } } } },
    ]),
  ]);

  const byStatus = statusCounts.reduce((acc, item) => {
    const key = String(item._id || 'pending').toLowerCase();
    acc[key] = item.count || 0;
    return acc;
  }, {});

  return {
    totalBookings: Object.values(byStatus).reduce((sum, count) => sum + count, 0),
    pendingBookings: byStatus.pending || 0,
    confirmedBookings: byStatus.confirmed || 0,
    completedBookings: byStatus.completed || 0,
    cancelledBookings: byStatus.cancelled || 0,
    totalRevenue: revenueResult[0]?.totalRevenue || 0,
    byStatus,
  };
};

const listAdminBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find(getBookingQuery(req.query))
      .select(ORDER_SELECT)
      .populate('user', 'name email phone createdAt')
      .populate('tourId', 'name price discountEnabled discountPrice groupDiscountEnabled groupDiscount4 groupDiscount5 groupDiscount6Plus')
      .sort({ createdAt: -1 })
      .lean();

    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data: bookings.map(normalizeBooking) });
  } catch (error) {
    next(error);
  }
};

const getAdminBookingStats = async (req, res, next) => {
  try {
    const stats = await getBookingStats();
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data: stats, ...stats });
  } catch (error) {
    next(error);
  }
};

const getDashboardSummary = async (req, res, next) => {
  try {
    const [totalUsers, totalTours, totalDivisions, bookingStats, recentBookings] = await Promise.all([
      User.countDocuments({ isActive: { $ne: false } }),
      Tour.countDocuments({}),
      Division.countDocuments({ isActive: { $ne: false } }),
      getBookingStats(),
      Booking.find({})
        .select(ORDER_SELECT)
        .populate('user', 'name email phone createdAt')
        .populate('tourId', 'name')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      success: true,
      data: {
        totalUsers,
        totalTours,
        totalDivisions,
        ...bookingStats,
        recentBookings: recentBookings.map(normalizeBooking),
      },
    });
  } catch (error) {
    next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 25)));
    const q = String(req.query.q || req.query.search || '').trim();
    const query = {};

    if (q) {
      const regex = new RegExp(escapeRegex(q), 'i');
      query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const [users, total, bookingCounts] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
      Booking.aggregate([
        { $group: { _id: '$email', count: { $sum: 1 } } },
      ]),
    ]);

    const countByEmail = bookingCounts.reduce((acc, item) => {
      acc[String(item._id || '').toLowerCase()] = item.count || 0;
      return acc;
    }, {});

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      success: true,
      data: users.map((user) => normalizeUser(user, countByEmail)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return next(new AppError('User not found', 404));

    const bookings = await Booking.find({ email: user.email })
      .select(ORDER_SELECT)
      .populate('tourId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      success: true,
      data: {
        user: normalizeUser(user, { [String(user.email).toLowerCase()]: bookings.length }),
        bookings: bookings.map(normalizeBooking),
      },
    });
  } catch (error) {
    next(error);
  }
};

const addUser = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body || {};
    if (!name || !email || !password) {
      return next(new AppError('Name, email, and password are required', 400));
    }
    if (String(password).length < 6) {
      return next(new AppError('Password must be at least 6 characters', 400));
    }
    const existing = await User.findOne({ email: String(email).toLowerCase().trim() }).lean();
    if (existing) return next(new AppError('A user with this email already exists', 409));

    const user = await User.create({
      name,
      email: String(email).toLowerCase().trim(),
      password,
      phone: phone || '',
    });

    res.status(201).json({ success: true, data: normalizeUser(user.toObject()) });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }).select('-password').lean();
    if (!user) return next(new AppError('User not found', 404));
    res.json({ success: true, data: normalizeUser(user) });
  } catch (error) {
    next(error);
  }
};

const listDivisions = async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const query = includeInactive ? {} : { isActive: { $ne: false } };
    const divisions = await Division.find(query).sort({ name: 1 }).lean();
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data: divisions.map(normalizeDivision) });
  } catch (error) {
    next(error);
  }
};

const validateUniqueDivision = async ({ name, slug, id }) => {
  const conditions = [];
  if (name) conditions.push({ name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i') });
  if (slug) conditions.push({ slug: new RegExp(`^${escapeRegex(slug.trim())}$`, 'i') });
  if (!conditions.length) return;
  const duplicate = await Division.findOne({ $or: conditions, ...(id ? { _id: { $ne: id } } : {}) }).lean();
  if (duplicate) {
    const error = new Error('A division with this name or slug already exists');
    error.statusCode = 409;
    throw error;
  }
};

const saveDivision = async (req, res, next) => {
  try {
    const id = req.params.id;
    const name = String(req.body?.name || '').trim();
    const slug = String(req.body?.slug || '').trim();
    if (!name) return next(new AppError('Division name is required', 400));
    await validateUniqueDivision({ name, slug, id });

    const payload = {
      name,
      slug: slug || undefined,
      description: String(req.body?.description || '').trim(),
      bannerImage: String(req.body?.bannerImage || req.body?.banner_image || '').trim(),
      isActive: req.body?.isActive !== false,
    };

    const division = id
      ? await Division.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
      : await Division.create(payload);

    if (!division) return next(new AppError('Division not found', 404));
    tourService.clearListCache();
    res.status(id ? 200 : 201).json({ success: true, data: normalizeDivision(division.toObject()) });
  } catch (error) {
    next(error.statusCode ? new AppError(error.message, error.statusCode) : error);
  }
};

const deleteDivision = async (req, res, next) => {
  try {
    const linkedTours = await Tour.countDocuments({ division: req.params.id });
    if (linkedTours > 0) {
      return next(new AppError(`This division is assigned to ${linkedTours} tour${linkedTours === 1 ? '' : 's'}. Move or delete those tours before removing it.`, 409));
    }
    const division = await Division.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!division) return next(new AppError('Division not found', 404));
    tourService.clearListCache();
    res.json({ success: true, data: normalizeDivision(division.toObject()) });
  } catch (error) {
    next(error);
  }
};

const getSettings = async (req, res, next) => {
  try {
    const adminId = req.userId;
    const admin = adminId
      ? await Admin.findById(adminId).select('username email lastLogin createdAt').lean()
      : await Admin.findOne({ isActive: true }).select('username email lastLogin createdAt').sort({ createdAt: 1 }).lean();
    res.json({ success: true, data: admin || null });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { currentPassword, username, newPassword, confirmPassword } = req.body || {};
    const admin = req.userId
      ? await Admin.findById(req.userId)
      : await Admin.findOne({ isActive: true }).sort({ createdAt: 1 });

    if (!admin) return next(new AppError('Admin account not found', 404));
    if (!currentPassword || !(await admin.comparePassword(currentPassword))) {
      return next(new AppError('Current password is incorrect', 401));
    }
    if (username && String(username).trim().length < 3) {
      return next(new AppError('Username must be at least 3 characters', 400));
    }
    if (newPassword || confirmPassword) {
      if (String(newPassword || '').length < 6) {
        return next(new AppError('New password must be at least 6 characters', 400));
      }
      if (newPassword !== confirmPassword) {
        return next(new AppError('New password and confirmation do not match', 400));
      }
      admin.password = newPassword;
    }
    if (username) admin.username = String(username).trim();
    await admin.save();
    res.json({ success: true, data: { id: admin._id, username: admin.username, email: admin.email } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
  listAdminBookings,
  getAdminBookingStats,
  listUsers,
  getUserDetails,
  addUser,
  deleteUser,
  listDivisions,
  saveDivision,
  deleteDivision,
  getSettings,
  updateSettings,
  normalizeBooking,
};
