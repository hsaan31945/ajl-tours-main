const toMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

const normalizeGroupDiscountPercent = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.min(100, toMoney(number)) : null;
};

const getGroupDiscountTier = (travelers) => {
  const count = Number(travelers);
  if (!Number.isInteger(count) || count <= 3) return null;
  if (count === 4) return '4';
  if (count === 5) return '5';
  return '6Plus';
};

const getGroupDiscountConfig = (tour = {}) => ({
  enabled: tour.groupDiscountEnabled === true,
  groupDiscount4: normalizeGroupDiscountPercent(tour.groupDiscount4),
  groupDiscount5: normalizeGroupDiscountPercent(tour.groupDiscount5),
  groupDiscount6Plus: normalizeGroupDiscountPercent(tour.groupDiscount6Plus),
});

const calculateGroupDiscount = ({ tour, travelers, unitPrice }) => {
  const config = getGroupDiscountConfig(tour);
  const tier = config.enabled ? getGroupDiscountTier(travelers) : null;
  const originalUnit = toMoney(unitPrice);

  if (!tier || !Number.isFinite(originalUnit) || originalUnit <= 0) {
    return {
      enabled: config.enabled,
      tier: null,
      unitAmount: 0,
      totalAmount: 0,
      unitPriceAfterGroupDiscount: originalUnit,
      applied: false,
      percent: 0,
    };
  }

  const configuredPercent = config[`groupDiscount${tier}`];
  const percent = configuredPercent === null ? 0 : Math.min(configuredPercent, 100);
  const unitAmount = toMoney(originalUnit * (percent / 100));
  const totalAmount = toMoney(unitAmount * Number(travelers));

  return {
    enabled: true,
    tier,
    unitAmount,
    totalAmount,
    unitPriceAfterGroupDiscount: toMoney(Math.max(0, originalUnit - unitAmount)),
    applied: unitAmount > 0,
    percent,
  };
};

module.exports = {
  calculateGroupDiscount,
  getGroupDiscountConfig,
  getGroupDiscountTier,
  normalizeGroupDiscountPercent,
};
