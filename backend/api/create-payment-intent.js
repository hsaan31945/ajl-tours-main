const config = require('../lib/config');
const stripe = require('stripe')(config.stripe.secretKey);
const { connectDB } = require('../src/config/database');
const { getValidatedTourPricing } = require('../src/services/bookingPricingService');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', config.cors.origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', String(config.cors.credentials));

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bodyStr = Buffer.concat(chunks).toString() || '{}';
    const body = JSON.parse(bodyStr);

    const pricing = await getValidatedTourPricing(body);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: pricing.amountInCents,
      currency: pricing.currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        tourId: String(pricing.tour._id),
        tourName: pricing.tour.name,
        tickets: String(pricing.tickets),
        minTickets: String(pricing.minTickets),
        unitPrice: String(pricing.pricedUnit),
        total: String(pricing.total),
        groupDiscountTier: pricing.groupDiscountTier || '',
        groupDiscountUnitAmount: String(pricing.groupDiscountUnitAmount || 0),
        groupDiscountTotal: String(pricing.groupDiscountTotal || 0),
        currency: pricing.currency.toUpperCase(),
        flexibility: pricing.flexibility,
        selectedDate: body?.selectedDate ? String(body.selectedDate).slice(0, 10) : '',
      }
    });

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: pricing.total,
      currency: pricing.currency.toUpperCase(),
      pricing: {
        unitPrice: pricing.pricedUnit,
        baseUnitPrice: pricing.unitPrice,
        originalUnitPrice: pricing.originalUnitPrice,
        discountUnitPrice: pricing.discountUnitPrice,
        saleUnitPrice: pricing.saleUnitPrice,
        groupDiscount: pricing.groupDiscount,
        groupDiscountTier: pricing.groupDiscountTier,
        groupDiscountUnitAmount: pricing.groupDiscountUnitAmount,
        groupDiscountTotal: pricing.groupDiscountTotal,
        hasGroupDiscount: pricing.hasGroupDiscount,
        tickets: pricing.tickets,
        minTickets: pricing.minTickets,
        total: pricing.total,
        flexibility: pricing.flexibility,
      },
    });
  } catch (err) {
    console.error('create-payment-intent error:', err);
    return res.status(err.statusCode || 500).json({
      error: err.statusCode ? err.message : 'Failed to create payment intent'
    });
  }
};
