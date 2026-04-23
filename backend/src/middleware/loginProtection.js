const { RateLimiterRedis, RateLimiterMemory } = require("rate-limiter-flexible");
const { getRedis } = require("../config/redis");

const redis = getRedis();

const limiter = redis
  ? new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: "login_fail",
      points: 5,
      duration: 60 * 15,
      blockDuration: 60 * 30,
    })
  : new RateLimiterMemory({
      keyPrefix: "login_fail_mem",
      points: 5,
      duration: 60 * 15,
      blockDuration: 60 * 30,
    });

function keyFor({ email, ip, tenantId }) {
  const e = email && String(email).trim() ? String(email).trim().toLowerCase() : "unknown";
  const t = tenantId != null ? String(tenantId) : "na";
  return `${e}_${ip}_${t}`;
}

async function loginProtection(req, res, next) {
  const email = req.body?.email;
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  // Login happens pre-auth; tenant is not known yet → keep placeholder.
  const k = keyFor({ email, ip, tenantId: "preauth" });

  try {
    await limiter.consume(k);
    next();
  } catch (rejRes) {
    return res.status(429).json({
      error: "Too many login attempts",
      retry_after: Math.round((rejRes.msBeforeNext || 0) / 1000),
    });
  }
}

async function resetLoginFailures({ email, ip }) {
  const k = keyFor({ email, ip, tenantId: "preauth" });
  try {
    await limiter.delete(k);
  } catch {
    /* ignore */
  }
}

module.exports = { loginProtection, resetLoginFailures };

