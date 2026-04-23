/**
 * Wrapper auth middleware that normalizes req.user to:
 *   { id, tenantId, role }
 *
 * Internally delegates to existing `auth.middleware.js` (cookie + bearer,
 * token_version checks, subscription gating, etc).
 */

const legacyAuth = require("./auth.middleware");

module.exports = function auth(req, res, next) {
  return legacyAuth(req, res, (err) => {
    if (err) return next(err);

    const u = req.user || {};
    const normalized = {
      id: u.id ?? u.userId ?? null,
      tenantId: u.tenantId ?? u.orgId ?? null,
      role: u.role ?? null,
    };

    // Preserve legacy payload fields for existing controllers/services.
    req.user = { ...u, ...normalized };
    if (req.user.userId == null && normalized.id != null) {
      req.user.userId = normalized.id;
    }
    if (req.user.orgId == null && normalized.tenantId != null) {
      req.user.orgId = normalized.tenantId;
    }

    if (req.user.tenantId != null) {
      req.tenantId = req.user.tenantId;
    }

    next();
  });
};

