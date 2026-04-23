const { RateLimiterRedis, RateLimiterMemory } = require("rate-limiter-flexible");
const { getRedis } = require("../config/redis");

const redis = getRedis();

// Strict write limiter to reduce SMS/email abuse from public booking.
const limiter = redis
  ? new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: "public_booking_write",
      points: 12,
      duration: 60 * 15,
      blockDuration: 60 * 30,
    })
  : new RateLimiterMemory({
      keyPrefix: "public_booking_write_mem",
      points: 12,
      duration: 60 * 15,
      blockDuration: 60 * 30,
    });

function keyFor(req) {
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const slug = (req.params && req.params.slug) || "unknown";
  // tenant isolation by slug (public)
  return `${slug}_${ip}`;
}

async function publicBookingProtection(req, res, next) {
  try {
    await limiter.consume(keyFor(req));
    next();
  } catch (rejRes) {
    return res.status(429).json({
      error: "Too many booking attempts",
      retry_after: Math.round((rejRes.msBeforeNext || 0) / 1000),
    });
  }
}

module.exports = { publicBookingProtection };

