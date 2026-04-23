const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { redisStoreOrNull } = require("./rateLimitRedisStore");

/**
 * Public limiter key: per-IP + per-salon slug.
 * - smanjuje abuse po salonu
 * - sprečava da jedna IP adresa iscrpi limit za sve slugs
 * - ipKeyGenerator: obavezno za express-rate-limit v7 (IPv6 / validacija ključa)
 */
function publicKey(req) {
  const slug = (req.params && req.params.slug) || "unknown";
  const ip = ipKeyGenerator(req.ip ?? "");
  return `${ip}|${slug}`;
}

/**
 * @param {{ windowMs: number, max: number, name: string }} cfg
 */
function makePublicLimiter(cfg) {
  const store = redisStoreOrNull(`public:${cfg.name}`);
  return rateLimit({
    windowMs: cfg.windowMs,
    max: cfg.max,
    standardHeaders: true,
    legacyHeaders: false,
    ...(store ? { store } : {}),
    keyGenerator: publicKey,
    handler: (req, res, _next, options) => {
      const retryAfterSec = Math.ceil(options.windowMs / 1000);
      return res.status(429).json({
        error: `Previše zahteva (${cfg.name}). Pokušaj ponovo kasnije.`,
        retry_after_seconds: retryAfterSec,
      });
    },
  });
}

module.exports = { makePublicLimiter };

