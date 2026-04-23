/**
 * Tenant-scoped DB wrapper for this codebase (pg).
 *
 * The DB uses `organization_id` as tenant key. Newer migrations also expose
 * `tenant_id` generated from `organization_id`.
 *
 * This wrapper gives you a safe default for common operations without switching
 * your whole project to an ORM.
 */

const pool = require("../config/db");

function assertTenantId(tenantId) {
  const t = Number(tenantId);
  if (!Number.isFinite(t) || t <= 0) {
    const err = new Error("Tenant context missing");
    err.statusCode = 400;
    throw err;
  }
  return t;
}

function db(tenantId) {
  const t = assertTenantId(tenantId);

  return {
    tenantId: t,

    // Raw query access (still allowed) – caller must include tenant scope.
    query(sql, params = []) {
      return pool.query(sql, params);
    },

    clients: {
      async findMany() {
        const r = await pool.query(
          `SELECT * FROM clients WHERE organization_id = $1 ORDER BY id DESC`,
          [t]
        );
        return r.rows;
      },
      async create(data) {
        const name = String(data.name || "").trim();
        const phone = data.phone != null ? String(data.phone) : null;
        const email =
          data.email != null && String(data.email).trim() !== ""
            ? String(data.email).trim().toLowerCase()
            : null;
        const notes = data.notes != null ? String(data.notes) : null;
        const r = await pool.query(
          `INSERT INTO clients (organization_id, name, phone, email, notes)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [t, name, phone, email, notes]
        );
        return r.rows[0];
      },
    },

    appointments: {
      async findManyByDay(dayYmd, timeZone = "Europe/Belgrade") {
        const r = await pool.query(
          `SELECT a.*
           FROM appointments a
           WHERE a.organization_id = $1
             AND to_char(timezone($3::text, a.date), 'YYYY-MM-DD') = $2
           ORDER BY a.date ASC`,
          [t, dayYmd, timeZone]
        );
        return r.rows;
      },
    },
  };
}

module.exports = db;

