const roundGroupMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

export const normalizeGroupDiscountPercent = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.min(100, roundGroupMoney(number)) : null;
};

export const getGroupDiscountTier = (travelers) => {
  const count = Number(travelers);
  if (!Number.isInteger(count) || count <= 3) return null;
  if (count === 4) return "4";
  if (count === 5) return "5";
  return "6Plus";
};

export const getGroupDiscountConfig = (tour = {}) => ({
  enabled: tour?.groupDiscountEnabled === true,
  groupDiscount4: normalizeGroupDiscountPercent(tour?.groupDiscount4),
  groupDiscount5: normalizeGroupDiscountPercent(tour?.groupDiscount5),
  groupDiscount6Plus: normalizeGroupDiscountPercent(tour?.groupDiscount6Plus),
});

export const calculateGroupDiscount = ({ tour, travelers, unitPrice }) => {
  const config = getGroupDiscountConfig(tour);
  const tier = config.enabled ? getGroupDiscountTier(travelers) : null;
  const originalUnit = roundGroupMoney(unitPrice);

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
  const unitAmount = roundGroupMoney(originalUnit * (percent / 100));
  const totalAmount = roundGroupMoney(unitAmount * Number(travelers));

  return {
    enabled: true,
    tier,
    unitAmount,
    totalAmount,
    unitPriceAfterGroupDiscount: roundGroupMoney(Math.max(0, originalUnit - unitAmount)),
    applied: unitAmount > 0,
    percent,
  };
};
