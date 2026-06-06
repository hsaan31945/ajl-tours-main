import React from "react";
import { getGroupDiscountLabel } from "../utils/bookingPricing";

const money = (currency, value) => `${currency}${Number(value || 0).toFixed(2)}`;

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
  if (!pricing) return null;

  const currency = pricing.currency || "CHF";
  const count = Number(travelers || pricing.tickets || 1);
  const hasTourDiscount = Number(pricing.standardDiscountTotal || 0) > 0;
  const hasGroupDiscount = Boolean(pricing.hasGroupDiscount);
  const hasFlexibilityUpgrade = Number(pricing.flexibilityUpgradeTotal || 0) > 0;
  const tourDiscountPercent = formatPercent(pricing.standardDiscountPercent);

  return (
    <div className="border-y py-4 space-y-3 text-sm">
      <SummaryLine
        label={`Base price (${money(currency, pricing.originalBaseUnitPrice)} x ${count})`}
        value={money(currency, pricing.originalSubtotal)}
      />

      {hasTourDiscount && (
        <>
          <SummaryLine
            label={`Tour discount${tourDiscountPercent ? ` ${tourDiscountPercent}` : ""}`}
            value={`-${money(currency, pricing.standardDiscountTotal)}`}
            tone="discount"
          />
          <SummaryLine
            label={`Discounted price (${money(currency, pricing.saleUnitPrice)} x ${count})`}
            value={money(currency, pricing.saleSubtotal)}
          />
        </>
      )}

      {hasGroupDiscount && (
        <SummaryLine
          label={getGroupDiscountLabel(pricing, count)}
          value={`-${money(currency, pricing.groupDiscountTotal)}`}
          tone="discount"
        />
      )}

      {(hasTourDiscount || hasGroupDiscount) && (
        <SummaryLine
          label="Subtotal after discounts"
          value={money(currency, pricing.subtotalAfterDiscounts)}
        />
      )}

      {hasFlexibilityUpgrade && (
        <SummaryLine
          label="Flexibility upgrade"
          value={`+${money(currency, pricing.flexibilityUpgradeTotal)}`}
        />
      )}
    </div>
  );
};

export default OrderSummaryBreakdown;
