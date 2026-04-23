const { RateLimiterRedis, RateLimiterMemory } = require("rate-limiter-flexible");
const { getRedis } = require("../config/redis");

const redis = getRedis();

// Protect routes that can trigger outgoing messages.
const limiter = redis
  ? new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: "notifications_write",
      points: 40,
      duration: 60 * 15,
      blockDuration: 60 * 15,
    })
  : new RateLimiterMemory({
      keyPrefix: "notifications_write_mem",
      points: 40,
      duration: 60 * 15,
      blockDuration: 60 * 15,
    });

function keyFor(req) {
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const tenantId = req.tenantId ?? req.user?.tenantId ?? req.user?.orgId ?? "na";
  const userId = req.user?.id ?? req.user?.userId ?? "na";
  return `${tenantId}_${userId}_${ip}`;
}

async function notificationsProtection(req, res, next) {
  try {
    await limiter.consume(keyFor(req));
    next();
  } catch (rejRes) {
    return res.status(429).json({
      error: "Too many notification-triggering requests",
      retry_after: Math.round((rejRes.msBeforeNext || 0) / 1000),
    });
  }
}

module.exports = { notificationsProtection };

