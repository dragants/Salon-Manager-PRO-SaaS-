const pool = require("../../config/db");

const CACHE_TTL_MS = 30_000;
const cache = new Map(); // tenantId -> { expiresAt, flags }

async function getCatalog() {
  const r = await pool.query(
    `SELECT key, description, default_enabled
     FROM feature_flags
     ORDER BY key ASC`
  );
  return r.rows.map((x) => ({
    key: String(x.key),
    description: x.description ?? null,
    default_enabled: Boolean(x.default_enabled),
  }));
}

async function getFlagsForTenant(tenantId) {
  const now = Date.now();
  const hit = cache.get(tenantId);
  if (hit && hit.expiresAt > now) {
    return hit.flags;
  }

  const catalogRes = await pool.query(
    `SELECT key, default_enabled FROM feature_flags`
  );
  const out = {};
  for (const row of catalogRes.rows) {
    out[String(row.key)] = Boolean(row.default_enabled);
  }

  const tenantRes = await pool.query(
    `SELECT flag_key, enabled
     FROM tenant_feature_flags
     WHERE tenant_id = $1`,
    [tenantId]
  );
  for (const row of tenantRes.rows) {
    out[String(row.flag_key)] = Boolean(row.enabled);
  }

  cache.set(tenantId, { expiresAt: now + CACHE_TTL_MS, flags: out });
  return out;
}

function invalidateTenantCache(tenantId) {
  cache.delete(tenantId);
}

async function setTenantFlags(tenantId, flags) {
  const entries = Object.entries(flags || {}).filter(
    ([k, v]) => typeof k === "string" && typeof v === "boolean"
  );
  if (entries.length === 0) {
    return getFlagsForTenant(tenantId);
  }

  // Ensure catalog keys exist (default OFF).
  for (const [key] of entries) {
    await pool.query(
      `INSERT INTO feature_flags (key, default_enabled)
       VALUES ($1, FALSE)
       ON CONFLICT (key) DO NOTHING`,
      [key]
    );
  }

  // Upsert per-tenant overrides.
  for (const [key, enabled] of entries) {
    await pool.query(
      `INSERT INTO tenant_feature_flags (tenant_id, flag_key, enabled)
       VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id, flag_key) DO UPDATE
         SET enabled = EXCLUDED.enabled,
             updated_at = NOW()`,
      [tenantId, key, enabled]
    );
  }

  invalidateTenantCache(tenantId);
  return getFlagsForTenant(tenantId);
}

module.exports = {
  getCatalog,
  getFlagsForTenant,
  setTenantFlags,
  invalidateTenantCache,
};

