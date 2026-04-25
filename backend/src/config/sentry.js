const Sentry = require("@sentry/node");

/**
 * Minimal Sentry init for Express.
 * Enabled only when `SENTRY_DSN` is provided.
 */
function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return null;
  }
  Sentry.init({
    dsn,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || "0"),
    environment: process.env.NODE_ENV || "development",
  });
  return Sentry;
}

module.exports = { Sentry, initSentry };

