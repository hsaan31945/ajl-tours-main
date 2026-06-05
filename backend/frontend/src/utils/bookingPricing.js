export const FLEXIBILITY_MULTIPLIER = 1.225;
export const DEFAULT_CURRENCY = "CHF";

export const parseTicketCount = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
};

export const getMinTickets = (tour) => {
  const number = Number(tour?.minTicketsPerBooking);
  return Number.isInteger(number) && number > 0 ? number : 1;
};

export const getTourCurrency = (tour) => {
  const currency = String(tour?.currency || DEFAULT_CURRENCY).trim();
  return currency || DEFAULT_CURRENCY;
};

export const getDatePrice = (tour, selectedDate) => {
  if (!selectedDate || !tour?.datePrices) return null;
  const key = String(selectedDate).slice(0, 10);
  const value = tour.datePrices[key];
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

export const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

export const getRawDiscountPrice = (tour) => (
  tour?.discountPrice ??
  tour?.discountedPrice ??
  tour?.salePrice ??
  tour?.metadata?.discountPrice ??
  tour?.metadata?.discountedPrice ??
  tour?.metadata?.salePrice ??
  tour?.metadata?.discount?.price ??
  null
);

export const getDiscountPrice = (tour, originalPrice = tour?.price) => {
  const rawDiscountPrice = getRawDiscountPrice(tour);
  if (rawDiscountPrice === null || rawDiscountPrice === undefined || rawDiscountPrice === "") return null;

  const original = Number(originalPrice);
  const discountPrice = Number(rawDiscountPrice);
  if (!Number.isFinite(original) || !Number.isFinite(discountPrice)) return null;
  if (discountPrice < 0 || discountPrice >= original) return null;

  // Older tour saves may have a valid discountPrice without discountEnabled set.
  // Treat the valid lower price as the source of truth for customer pricing.
  return roundMoney(discountPrice);
};

export const getEffectiveTourPrice = (tour, fallbackPrice = 0) => {
  const originalPrice = roundMoney(tour?.price ?? fallbackPrice);
  return getDiscountPrice(tour, originalPrice) ?? originalPrice;
};

export const calculateBookingPricing = ({
  tour,
  tickets,
  selectedDate,
  flexibility = "standard",
  fallbackPrice = 0,
}) => {
  const parsedTickets = parseTicketCount(tickets);
  const minTickets = getMinTickets(tour);
  const currentTickets = Math.max(parsedTickets || minTickets, minTickets);
  const originalBaseUnitPrice = roundMoney(getDatePrice(tour, selectedDate) ?? tour?.price ?? fallbackPrice);
  const discountUnitPrice = getDiscountPrice(tour, originalBaseUnitPrice);
  const baseUnitPrice = discountUnitPrice ?? originalBaseUnitPrice;
  const unitPrice = flexibility === "upgrade"
    ? roundMoney(baseUnitPrice * FLEXIBILITY_MULTIPLIER)
    : baseUnitPrice;
  const total = roundMoney(unitPrice * currentTickets);

  return {
    tickets: currentTickets,
    validTickets: currentTickets >= minTickets,
    minTickets,
    originalBaseUnitPrice,
    discountUnitPrice,
    hasDiscount: discountUnitPrice !== null,
    baseUnitPrice,
    unitPrice,
    total,
    currency: getTourCurrency(tour),
  };
};
