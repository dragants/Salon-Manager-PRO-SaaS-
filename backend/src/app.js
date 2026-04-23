const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const { redisStoreOrNull } = require("./middleware/rateLimitRedisStore");

const { FRONTEND_URLS } = require("./config/env");
const paddleWebhook = require("./webhooks/paddle.webhook");
const stripeWebhook = require("./webhooks/stripe.webhook");

/** Dodatni origini (zarezom), npr. drugi front ili staging — vidi CORS_ORIGINS u .env */
const CORS_EXTRA_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const authRoutes = require("./modules/auth/auth.routes");
const appointmentRoutes = require("./modules/appointments/appointments.routes");
const clientRoutes = require("./modules/clients/clients.routes");
const serviceRoutes = require("./modules/services/services.routes");
const paymentRoutes = require("./modules/payments/payments.routes");
const organizationRoutes = require("./modules/organizations/organizations.routes");
const userRoutes = require("./modules/users/users.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const analyticsRoutes = require("./modules/analytics/analytics.routes");
const auditRoutes = require("./modules/audit/audit.routes");
const billingRoutes = require("./modules/billing/billing.routes");
const bookingRoutes = require("./modules/booking/booking.routes");
const availabilityRoutes = require("./modules/availability/availability.routes");
const shiftsRoutes = require("./modules/shifts/shifts.routes");
const expensesRoutes = require("./modules/expenses/expenses.routes");
const suppliesRoutes = require("./modules/supplies/supplies.routes");
const loyaltyRoutes = require("./modules/loyalty/loyalty.routes");

const { GLOBAL_MAX, GLOBAL_WINDOW_MS } = require("./config/rate-limits");
const errorHandler = require("./middleware/error.middleware");

const app = express();

app.use(helmet());

const LAN_ORIGIN_RE =
  /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/i;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (FRONTEND_URLS.includes(origin)) {
        return callback(null, true);
      }
      if (CORS_EXTRA_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      if (LAN_ORIGIN_RE.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

app.post(
  "/webhooks/paddle",
  express.urlencoded({ extended: false }),
  paddleWebhook
);

// Stripe requires raw body for signature verification (must be before express.json()).
app.post("/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhook);

app.use(cookieParser());
app.use(express.json({ limit: "12mb" }));

app.use(
  (() => {
    const store = redisStoreOrNull("global");
    return rateLimit({
    windowMs: GLOBAL_WINDOW_MS,
    max: GLOBAL_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    ...(store ? { store } : {}),
    /* /auth ima sopstvene, strože limitere — ne mešati sa 500/15m za API. */
    skip: (req) =>
      req.path === "/health" ||
      req.path === "/webhooks/paddle" ||
      req.path === "/webhooks/stripe" ||
      req.path.startsWith("/public") ||
      req.path === "/appointments/stream" ||
      req.path.startsWith("/auth"),
    });
  })()
);

app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")
);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/public", bookingRoutes);

app.use("/auth", authRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/availability", availabilityRoutes);
app.use("/shifts", shiftsRoutes);
app.use("/clients", clientRoutes);
app.use("/services", serviceRoutes);
app.use("/payments", paymentRoutes);
app.use("/organizations", organizationRoutes);
app.use("/users", userRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/audit", auditRoutes);
app.use("/billing", billingRoutes);
app.use("/expenses", expensesRoutes);
app.use("/supplies", suppliesRoutes);
app.use("/loyalty", loyaltyRoutes);

app.use(errorHandler);

module.exports = app;
