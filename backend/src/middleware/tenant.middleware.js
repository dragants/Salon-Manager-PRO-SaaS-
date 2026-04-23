/**
 * Enforce tenant context after auth.
 * Canonical: req.tenantId (== req.user.tenantId == req.user.orgId).
 */

const { assertTenantId } = require("../tenancy/db");

module.exports = function tenantMiddleware(req, res, next) {
  try {
    const tenantId = req.tenantId ?? req.user?.tenantId ?? req.user?.orgId;
    req.tenantId = assertTenantId(tenantId);
    if (req.user && req.user.tenantId == null) {
      req.user.tenantId = req.tenantId;
    }
    next();
  } catch (e) {
    if (e.statusCode) {
      return res.status(e.statusCode).json({ error: e.message });
    }
    next(e);
  }
};

