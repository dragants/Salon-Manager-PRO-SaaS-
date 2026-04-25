const Stripe = require("stripe");

let stripe;
function getStripe() {
  if (stripe) {
    return stripe;
  }
  // Accept both `STRIPE_SECRET_KEY` (preferred) and legacy `STRIPE_SECRET`.
  const key = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;
  if (!key) {
    const err = new Error("STRIPE_SECRET_KEY is not set");
    err.statusCode = 500;
    throw err;
  }
  stripe = new Stripe(key);
  return stripe;
}

module.exports = { getStripe };

