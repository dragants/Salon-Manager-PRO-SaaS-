const { RateLimiterRedis, RateLimiterMemory } = require("rate-limiter-flexible");
const { getRedis } = require("../config/redis");

function isLoginProtectionDisabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.LOGIN_PROTECTION_DISABLED === "true"
  );
}

const redis = getRedis();

/** U produkciji strože; u developmentu kraće blokade da lokalno testiranje 2FA ne zakuca na 30 min. */
const isProd = process.env.NODE_ENV === "production";
const loginLimiterOpts = isProd
  ? { points: 5, duration: 60 * 15, blockDuration: 60 * 30 }
  : { points: 20, duration: 60 * 5, blockDuration: 90 };

const limiter = redis
  ? new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: "login_fail",
      ...loginLimiterOpts,
    })
  : new RateLimiterMemory({
      keyPrefix: "login_fail_mem",
      ...loginLimiterOpts,
    });

function keyFor({ email, ip, tenantId }) {
  const e = email && String(email).trim() ? String(email).trim().toLowerCase() : "unknown";
  const t = tenantId != null ? String(tenantId) : "na";
  return `${e}_${ip}_${t}`;
}

async function loginProtection(req, res, next) {
  if (isLoginProtectionDisabled()) {
    return next();
  }
  const email = req.body?.email;
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  // Login happens pre-auth; tenant is not known yet → keep placeholder.
  const k = keyFor({ email, ip, tenantId: "preauth" });

  try {
    await limiter.consume(k);
    next();
  } catch (rejRes) {
    const sec = Math.max(1, Math.round((rejRes.msBeforeNext || 0) / 1000));
    return res.status(429).json({
      error: `Previše pokušaja prijave. Sačekaj oko ${sec} s pa pokušaj ponovo.`,
      code: "LOGIN_RATE_LIMIT",
      retry_after: sec,
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

