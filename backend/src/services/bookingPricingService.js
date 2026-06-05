const Tour = require('../../models/Tour');
const { normalizeTourId, isValidObjectId } = require('../utils/tourId');

const FLEXIBILITY_MULTIPLIER = 1.225;
const DEFAULT_CURRENCY = 'CHF';

class BookingValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'BookingValidationError';
    this.statusCode = statusCode;
  }
}

const toPositiveInteger = (value, fieldName = 'tickets') => {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new BookingValidationError(`${fieldName} must be a positive whole number`);
  }
  return number;
};

const toMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

const normalizeCurrency = (currency) => {
  const value = String(currency || DEFAULT_CURRENCY).trim().toLowerCase();
  return value || DEFAULT_CURRENCY.toLowerCase();
};

const getDatePrice = (tour, selectedDate) => {
  if (!selectedDate || !tour?.datePrices) return null;

  const dateKey = String(selectedDate).slice(0, 10);
  const datePrices = tour.datePrices;

  let value;
  if (typeof datePrices.get === 'function') {
    value = datePrices.get(dateKey);
  } else {
    value = datePrices[dateKey];
  }

  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

const getDiscountPrice = (tour, originalPrice) => {
  if (!tour?.discountEnabled) return null;
  const discountPrice = Number(tour.discountPrice);
  const original = Number(originalPrice);
  if (!Number.isFinite(discountPrice) || !Number.isFinite(original)) return null;
  return discountPrice >= 0 && discountPrice < original ? toMoney(discountPrice) : null;
};

const calculateTourPricing = (tour, options = {}) => {
  if (!tour) {
    throw new BookingValidationError('Tour not found', 404);
  }
  if (tour.isActive === false) {
    throw new BookingValidationError('Tour is not available for booking', 400);
  }

  const tickets = toPositiveInteger(options.tickets ?? options.travelers, 'tickets');
  const minTickets = Math.max(1, Number(tour.minTicketsPerBooking) || 1);
  if (tickets < minTickets) {
    throw new BookingValidationError(`Minimum ${minTickets} tickets are required for this tour`);
  }

  const maxTickets = Number(tour.maxTotalTickets);
  if (Number.isFinite(maxTickets) && maxTickets > 0 && tickets > maxTickets) {
    throw new BookingValidationError(`Only ${maxTickets} tickets are available for this tour`);
  }

  const flexibility = options.flexibility === 'upgrade' ? 'upgrade' : 'standard';
  const datePrice = getDatePrice(tour, options.selectedDate || options.tripDate || options.date);
  const originalUnitPrice = toMoney(datePrice ?? tour.price);
  const discountUnitPrice = getDiscountPrice(tour, originalUnitPrice);
  const unitPrice = discountUnitPrice ?? originalUnitPrice;
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    throw new BookingValidationError('Tour price is not valid');
  }

  const pricedUnit = flexibility === 'upgrade'
    ? toMoney(unitPrice * FLEXIBILITY_MULTIPLIER)
    : unitPrice;
  const total = toMoney(pricedUnit * tickets);

  return {
    tour,
    tickets,
    travelers: tickets,
    minTickets,
    maxTickets: Number.isFinite(maxTickets) && maxTickets > 0 ? maxTickets : null,
    originalUnitPrice,
    discountUnitPrice,
    hasDiscount: discountUnitPrice !== null,
    unitPrice,
    pricedUnit,
    total,
    amountInCents: Math.round(total * 100),
    currency: normalizeCurrency(tour.currency || options.currency),
    flexibility,
  };
};

const getValidatedTourPricing = async (options = {}) => {
  const tourId = normalizeTourId(options.tourId || options.id);
  if (!tourId || !isValidObjectId(tourId)) {
    throw new BookingValidationError('Valid tourId is required');
  }

  const tour = await Tour.findById(tourId);
  if (!tour) {
    throw new BookingValidationError('Tour not found', 404);
  }

  return calculateTourPricing(tour, options);
};

module.exports = {
  BookingValidationError,
  DEFAULT_CURRENCY,
  FLEXIBILITY_MULTIPLIER,
  calculateTourPricing,
  getValidatedTourPricing,
  toPositiveInteger,
};
