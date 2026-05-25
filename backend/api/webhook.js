const { connectDB, models } = require('../lib/db');
const config = require('../lib/config');
const stripe = require('stripe')(config.stripe.secretKey);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': config.cors.origin,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Stripe-Signature'
};

// Helper function to handle CORS
const handleCORS = (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return true;
  }
  return false;
};

// Helper function to send JSON response
const sendJSON = (res, statusCode, data) => {
  res.writeHead(statusCode, {
    ...corsHeaders,
    'Content-Type': 'application/json'
  });
  res.end(JSON.stringify(data));
};

module.exports = async (req, res) => {
  try {
    // Handle CORS preflight
    if (handleCORS(req, res)) return;

    // Only handle POST requests
    if (req.method !== 'POST') {
      return sendJSON(res, 405, { error: 'Method not allowed' });
    }

    // Connect to database
    await connectDB();

    // Get the raw body for Stripe signature verification
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const signature = req.headers['stripe-signature'];
        
        if (!signature) {
          return sendJSON(res, 400, { error: 'No Stripe signature provided' });
        }

        // Verify webhook signature
        let event;
        try {
          event = stripe.webhooks.constructEvent(
            body,
            signature,
            config.stripe.webhookSecret
          );
        } catch (err) {
          console.error('Webhook signature verification failed:', err.message);
          return sendJSON(res, 400, { error: 'Invalid signature' });
        }

        // Handle the event
        switch (event.type) {
          case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('Payment succeeded:', paymentIntent.id);
            
            // Update booking status if needed
            try {
              await models.Booking.updateOne(
                { stripePaymentId: paymentIntent.id },
                { paymentStatus: 'paid' }
              );
            } catch (error) {
              console.error('Error updating booking:', error);
            }
            break;

          case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.log('Payment failed:', failedPayment.id);
            
            // Update booking status
            try {
              await models.Booking.updateOne(
                { stripePaymentId: failedPayment.id },
                { paymentStatus: 'failed' }
              );
            } catch (error) {
              console.error('Error updating booking:', error);
            }
            break;

          default:
            console.log(`Unhandled event type: ${event.type}`);
        }

        return sendJSON(res, 200, { received: true });

      } catch (error) {
        console.error('Webhook error:', error);
        return sendJSON(res, 500, { error: 'Webhook processing failed' });
      }
    });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return sendJSON(res, 500, { 
      error: 'Internal server error',
      message: config.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};
