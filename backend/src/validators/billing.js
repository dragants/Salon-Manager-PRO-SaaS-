const { z } = require("zod");

// 🔹 Plan enum
const planEnum = z.enum(["free", "pro", "premium"]);

// 🔹 Create / update subscription
const billingSchema = z.object({
  plan: planEnum,
  billingCycle: z.enum(["monthly", "yearly"]),
  paymentMethodId: z.string().min(3).max(100).optional(),
  coupon: z.string().max(50).optional(),
  autoRenew: z.boolean().default(true),
});

// 🔹 Checkout session request
const checkoutSchema = z.object({
  priceId: z.string().min(3),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

// 🔹 Webhook safety (basic)
const stripeWebhookSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.any(),
  }),
});

/**
 * Paddle / Stripe checkout i portal — telo zahteva je prazno;
 * organizacija dolazi iz JWT-a (auth + tenant).
 */
const emptyBodySchema = z.object({}).strict();

module.exports = {
  planEnum,
  billingSchema,
  checkoutSchema,
  stripeWebhookSchema,

  // backwards-compatible exports used by current routes
  emptyBodySchema,
  billingPostSchema: emptyBodySchema,
};
