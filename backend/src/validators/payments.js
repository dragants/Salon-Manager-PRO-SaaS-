const { z } = require("zod");

// 💥 Currency whitelist (jače)
const currencyEnum = z.enum(["RSD", "EUR", "USD"]);

// 🔹 Payment create (full)
const paymentCreateSchema = z.object({
  appointmentId: z.string().uuid(),
  amount: z.number().positive().max(1000000),
  method: z.enum(["cash", "card", "transfer", "online"]),
  status: z.enum(["pending", "paid", "failed", "refunded"]).default("pending"),
  currency: currencyEnum.default("RSD"),
  note: z.string().max(500).optional(),
});

// 🔹 Refund
const refundSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().max(255).optional(),
});

// 🔹 Payment filter (GET)
const paymentQuerySchema = z.object({
  status: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  clientId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
});

// Backwards-compatible schema used by current `payments.routes.js`
// (controller/service currently accepts `{ amount, date? }`)
const createPaymentSchema = z.object({
  amount: z.coerce.number().positive().max(1000000),
  date: z.string().datetime().optional(),
});

module.exports = {
  currencyEnum,
  paymentCreateSchema,
  refundSchema,
  paymentQuerySchema,
  createPaymentSchema,
};
