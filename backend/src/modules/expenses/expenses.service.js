const pool = require("../../config/db");

function mapRow(r) {
  return {
    id: Number(r.id),
    organization_id: Number(r.organization_id),
    amount_rsd: Number(r.amount_rsd),
    title: r.title,
    category: r.category ?? null,
    notes: r.notes ?? null,
    spent_at:
      r.spent_at instanceof Date
        ? r.spent_at.toISOString().slice(0, 10)
        : String(r.spent_at).slice(0, 10),
    created_by_user_id:
      r.created_by_user_id != null ? Number(r.created_by_user_id) : null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

async function monthlyTotals(orgId, months) {
  const m = Math.min(24, Math.max(1, months));
  const r = await pool.query(
    `SELECT to_char(spent_at, 'YYYY-MM') AS ym,
            COALESCE(SUM(amount_rsd), 0)::bigint AS total_rsd
     FROM expenses
     WHERE organization_id = $1
       AND spent_at >= (date_trunc('month', CURRENT_DATE) - (($2::int - 1) * interval '1 month'))::date
     GROUP BY to_char(spent_at, 'YYYY-MM')
     ORDER BY ym DESC`,
    [orgId, m]
  );
  return r.rows.map((row) => ({
    month: row.ym,
    total_rsd: Number(row.total_rsd),
  }));
}

async function list(orgId, from, to) {
  const r = await pool.query(
    `SELECT id, organization_id, amount_rsd, title, category, notes,
            spent_at, created_by_user_id, created_at, updated_at
     FROM expenses
     WHERE organization_id = $1
       AND spent_at >= $2::date
       AND spent_at <= $3::date
     ORDER BY spent_at DESC, id DESC`,
    [orgId, from, to]
  );
  return r.rows.map(mapRow);
}

async function create(orgId, userId, body) {
  const r = await pool.query(
    `INSERT INTO expenses (
       organization_id, amount_rsd, title, category, notes, spent_at, created_by_user_id
     ) VALUES ($1, $2, $3, $4, $5, $6::date, $7)
     RETURNING id, organization_id, amount_rsd, title, category, notes,
               spent_at, created_by_user_id, created_at, updated_at`,
    [
      orgId,
      body.amount_rsd,
      body.title.trim(),
      body.category && String(body.category).trim()
        ? String(body.category).trim()
        : null,
      body.notes && String(body.notes).trim()
        ? String(body.notes).trim()
        : null,
      body.spent_at,
      userId,
    ]
  );
  return mapRow(r.rows[0]);
}

async function getOne(id, orgId) {
  const r = await pool.query(
    `SELECT id, organization_id, amount_rsd, title, category, notes,
            spent_at, created_by_user_id, created_at, updated_at
     FROM expenses
     WHERE id = $1 AND organization_id = $2`,
    [id, orgId]
  );
  if (r.rows.length === 0) return null;
  return mapRow(r.rows[0]);
}

async function update(id, orgId, patch) {
  const cur = await getOne(id, orgId);
  if (!cur) return null;

  const title = patch.title !== undefined ? patch.title.trim() : cur.title;
  const amount_rsd =
    patch.amount_rsd !== undefined ? patch.amount_rsd : cur.amount_rsd;
  const category =
    patch.category !== undefined
      ? patch.category && String(patch.category).trim()
        ? String(patch.category).trim()
        : null
      : cur.category;
  const notes =
    patch.notes !== undefined
      ? patch.notes && String(patch.notes).trim()
        ? String(patch.notes).trim()
        : null
      : cur.notes;
  const spent_at = patch.spent_at !== undefined ? patch.spent_at : cur.spent_at;

  const r = await pool.query(
    `UPDATE expenses SET
       title = $3,
       amount_rsd = $4,
       category = $5,
       notes = $6,
       spent_at = $7::date,
       updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING id, organization_id, amount_rsd, title, category, notes,
               spent_at, created_by_user_id, created_at, updated_at`,
    [id, orgId, title, amount_rsd, category, notes, spent_at]
  );
  return mapRow(r.rows[0]);
}

async function remove(id, orgId) {
  const r = await pool.query(
    `DELETE FROM expenses WHERE id = $1 AND organization_id = $2 RETURNING id`,
    [id, orgId]
  );
  return r.rowCount > 0;
}

module.exports = { monthlyTotals, list, create, getOne, update, remove };
