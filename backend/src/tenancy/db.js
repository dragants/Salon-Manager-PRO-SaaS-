/**
 * Minimal tenant-scoped DB helper.
 *
 * This repo currently scopes by `organization_id` everywhere.
 * We expose `tenantId` as the canonical name, but keep compatibility:
 * tenantId === orgId.
 *
 * Usage:
 *   const { db } = require("../tenancy/db");
 *   await db(req.tenantId).query("SELECT ... WHERE organization_id = $1", [req.tenantId]);
 */

const pool = require("../config/db");

function assertTenantId(tenantId) {
  const t = Number(tenantId);
  if (!Number.isFinite(t) || t <= 0) {
    const err = new Error("Missing tenant context");
    err.statusCode = 401;
    throw err;
  }
  return t;
}

function db(tenantId) {
  const t = assertTenantId(tenantId);
  return {
    tenantId: t,
    query(sql, params = []) {
      return pool.query(sql, params);
    },
  };
}

module.exports = { db, assertTenantId };

