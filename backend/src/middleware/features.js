const service = require("../modules/featureFlags/featureFlags.service");

module.exports = async function features(req, _res, next) {
  try {
    const tenantId = req.tenantId ?? req.user?.tenantId ?? req.user?.orgId;
    if (!tenantId) {
      req.features = {
        tenantId: null,
        flags: {},
        isEnabled: () => false,
      };
      return next();
    }
    const flags = await service.getFlagsForTenant(Number(tenantId));
    req.features = {
      tenantId: Number(tenantId),
      flags,
      isEnabled: (key, fallback = false) =>
        typeof flags[key] === "boolean" ? flags[key] : Boolean(fallback),
    };
    next();
  } catch (e) {
    // Fail-safe: never block requests if flags are broken.
    req.features = {
      tenantId: req.tenantId ?? null,
      flags: {},
      isEnabled: (_key, fallback = false) => Boolean(fallback),
    };
    next();
  }
};

