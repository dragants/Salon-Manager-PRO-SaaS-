const rateLimit = require("express-rate-limit");

/**
 * Public limiter key: per-IP + per-salon slug.
 * - smanjuje abuse po salonu
 * - sprečava da jedna IP adresa iscrpi limit za sve slugs
 */
function publicKey(req) {
  const slug = (req.params && req.params.slug) || "unknown";
  return `${req.ip}|${slug}`;
}

/**
 * @param {{ windowMs: number, max: number, name: string }} cfg
 */
function makePublicLimiter(cfg) {
  return rateLimit({
    windowMs: cfg.windowMs,
    max: cfg.max,
    standardHeaders: true,
    legacyHeaders: false,
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

