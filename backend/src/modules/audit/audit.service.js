const pool = require("../../config/db");

async function insertRow({
  organizationId,
  userId,
  action,
  entityType,
  entityId,
  meta,
}) {
  await pool.query(
    `INSERT INTO audit_log (organization_id, user_id, action, entity_type, entity_id, meta)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6::jsonb, '{}'::jsonb))`,
    [
      organizationId,
      userId ?? null,
      action,
      entityType ?? null,
      entityId ?? null,
      JSON.stringify(meta ?? {}),
    ]
  );
}

async function listForOrg(orgId, options = {}) {
  const lim = Math.min(
    Math.max(Number(options.limit) || 100, 1),
    200
  );
  const action =
    options.action && String(options.action).trim()
      ? String(options.action).trim().slice(0, 64)
      : null;

  const params = [orgId];
  let where = "WHERE a.organization_id = $1";
  if (action) {
    params.push(action);
    where += ` AND a.action = $${params.length}`;
  }
  params.push(lim);

  const res = await pool.query(
    `SELECT a.id,
            a.user_id,
            a.action,
            a.entity_type,
            a.entity_id,
            a.meta,
            a.created_at,
            u.email AS actor_email
     FROM audit_log a
     LEFT JOIN users u ON u.id = a.user_id
     ${where}
     ORDER BY a.created_at DESC
     LIMIT $${params.length}`,
    params
  );
  return res.rows;
}

module.exports = { insertRow, listForOrg };
