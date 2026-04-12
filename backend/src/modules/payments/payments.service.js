const pool = require("../../config/db");

async function getAll(orgId) {
  const res = await pool.query(
    `SELECT * FROM payments
     WHERE organization_id = $1
     ORDER BY date DESC`,
    [orgId]
  );
  return res.rows;
}

async function create(data, orgId) {
  const { amount, date } = data;
  const res = await pool.query(
    `INSERT INTO payments(organization_id, amount, date)
     VALUES($1, $2, COALESCE($3::timestamptz, NOW()))
     RETURNING *`,
    [orgId, amount, date || null]
  );
  return res.rows[0];
}

module.exports = { getAll, create };
