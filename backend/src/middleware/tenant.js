/**
 * Tenant context guard + anti-override.
 *
 * Critical rules:
 * - tenantId must come from auth token (req.user.tenantId), never body/query.
 * - any incoming tenantId in body/query is removed.
 */

module.exports = function tenant(req, res, next) {
  if (!req.user?.tenantId) {
    return res.status(400).json({ error: "Tenant context missing" });
  }

  if (req.body && typeof req.body === "object") {
    delete req.body.tenantId;
    delete req.body.tenant_id;
    delete req.body.organization_id;
    delete req.body.orgId;
  }
  if (req.query && typeof req.query === "object") {
    delete req.query.tenantId;
    delete req.query.tenant_id;
    delete req.query.organization_id;
    delete req.query.orgId;
  }

  req.tenantId = req.user.tenantId;
  next();
};

