import React from "react";
import { getGroupDiscountLabel } from "../utils/bookingPricing";
import { useCurrency } from "../context/CurrencyContext";

const formatPercent = (value) => {
  const percent = Number(value || 0);
  if (!Number.isFinite(percent) || percent <= 0) return "";
  return `${percent.toFixed(2).replace(/\.00$/, "")}%`;
};

const SummaryLine = ({ label, value, tone = "default", bold = false }) => {
  const toneClass = tone === "discount" ? "text-green-700" : "text-gray-900";
  return (
    <div className={`flex items-start justify-between gap-4 ${toneClass} ${bold ? "font-bold" : ""}`}>
      <span>{label}</span>
      <span className="shrink-0 text-right">{value}</span>
    </div>
  );
};

const OrderSummaryBreakdown = ({ pricing, travelers }) => {
  const { formatPrice } = useCurrency();

  if (!pricing) return null;

  const count = Number(travelers || pricing.tickets || 1);
  const hasTourDiscount = Number(pricing.standardDiscountTotal || 0) > 0;
  const hasGroupDiscount = Boolean(pricing.hasGroupDiscount);
  const hasFlexibilityUpgrade = Number(pricing.flexibilityUpgradeTotal || 0) > 0;
  const tourDiscountPercent = formatPercent(pricing.standardDiscountPercent);

  return (
    <div className="border-y py-4 space-y-3 text-sm">
      <SummaryLine
        label={`Base price (${formatPrice(pricing.originalBaseUnitPrice)} x ${count})`}
        value={formatPrice(pricing.originalSubtotal)}
      />

      {hasTourDiscount && (
        <>
          <SummaryLine
            label={`Tour discount${tourDiscountPercent ? ` ${tourDiscountPercent}` : ""}`}
            value={`-${formatPrice(pricing.standardDiscountTotal)}`}
            tone="discount"
          />
          <SummaryLine
            label={`Discounted price (${formatPrice(pricing.saleUnitPrice)} x ${count})`}
            value={formatPrice(pricing.saleSubtotal)}
          />
        </>
      )}

      {hasGroupDiscount && (
        <SummaryLine
          label={getGroupDiscountLabel(pricing, count)}
          value={`-${formatPrice(pricing.groupDiscountTotal)}`}
          tone="discount"
        />
      )}

      {(hasTourDiscount || hasGroupDiscount) && (
        <SummaryLine
          label="Subtotal after discounts"
          value={formatPrice(pricing.subtotalAfterDiscounts)}
        />
      )}

      {hasFlexibilityUpgrade && (
        <SummaryLine
          label="Flexibility upgrade"
          value={`+${formatPrice(pricing.flexibilityUpgradeTotal)}`}
        />
      )}
    </div>
  );
};

export default OrderSummaryBreakdown;
