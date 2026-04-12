const pool = require("../../config/db");

async function getAll(orgId) {
  const res = await pool.query(
    `SELECT * FROM services
     WHERE organization_id = $1
     ORDER BY name ASC`,
    [orgId]
  );
  return res.rows;
}

async function getById(id, orgId) {
  const res = await pool.query(
    `SELECT * FROM services WHERE id = $1 AND organization_id = $2`,
    [id, orgId]
  );
  if (res.rows.length === 0) {
    const err = new Error("Not found");
    err.statusCode = 404;
    throw err;
  }
  return res.rows[0];
}

async function create(data, orgId) {
  const { name, price, duration, buffer_minutes } = data;
  const res = await pool.query(
    `INSERT INTO services(organization_id, name, price, duration, buffer_minutes)
    VALUES($1, $2, $3, $4, $5)
    RETURNING *`,
    [orgId, name, price, duration ?? 60, buffer_minutes ?? 0]
  );
  return res.rows[0];
}

async function update(id, data, orgId) {
  const allowed = ["name", "price", "duration", "buffer_minutes"];
  const entries = Object.entries(data).filter(
    ([k, v]) => allowed.includes(k) && v !== undefined
  );
  if (entries.length === 0) {
    return getById(id, orgId);
  }
  const setClauses = [];
  const values = [];
  let n = 1;
  for (const [key, val] of entries) {
    setClauses.push(`${key} = $${n++}`);
    values.push(val);
  }
  values.push(id, orgId);
  const res = await pool.query(
    `UPDATE services SET ${setClauses.join(", ")}
     WHERE id = $${n} AND organization_id = $${n + 1}
     RETURNING *`,
    values
  );
  if (res.rowCount === 0) {
    const err = new Error("Not found");
    err.statusCode = 404;
    throw err;
  }
  return res.rows[0];
}

async function remove(id, orgId) {
  const res = await pool.query(
    `DELETE FROM services WHERE id = $1 AND organization_id = $2`,
    [id, orgId]
  );
  if (res.rowCount === 0) {
    const err = new Error("Not found");
    err.statusCode = 404;
    throw err;
  }
}

module.exports = { getAll, getById, create, update, remove };
