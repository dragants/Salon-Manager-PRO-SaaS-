const pool = require("../../config/db");

async function getAll(orgId) {
  const res = await pool.query(
    `SELECT s.*, sc.name AS category_name
     FROM services s
     LEFT JOIN service_categories sc ON sc.id = s.category_id AND sc.organization_id = s.organization_id
     WHERE s.organization_id = $1
     ORDER BY sc.sort_order ASC NULLS LAST, s.name ASC`,
    [orgId]
  );
  return res.rows;
}

async function getById(id, orgId) {
  const res = await pool.query(
    `SELECT s.*, sc.name AS category_name
     FROM services s
     LEFT JOIN service_categories sc ON sc.id = s.category_id AND sc.organization_id = s.organization_id
     WHERE s.id = $1 AND s.organization_id = $2`,
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
  const { name, price, duration, buffer_minutes, category_id, color, description } = data;
  const res = await pool.query(
    `INSERT INTO services(organization_id, name, price, duration, buffer_minutes, category_id, color, description)
    VALUES($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [orgId, name, price, duration ?? 60, buffer_minutes ?? 0, category_id ?? null, color ?? null, description ?? null]
  );
  return res.rows[0];
}

async function update(id, data, orgId) {
  const allowed = ["name", "price", "duration", "buffer_minutes", "category_id", "color", "description"];
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

/* ── Categories ── */

async function getAllCategories(orgId) {
  const res = await pool.query(
    `SELECT * FROM service_categories
     WHERE organization_id = $1
     ORDER BY sort_order ASC, name ASC`,
    [orgId]
  );
  return res.rows;
}

async function createCategory(data, orgId) {
  const { name, sort_order } = data;
  const res = await pool.query(
    `INSERT INTO service_categories(organization_id, name, sort_order)
     VALUES($1, $2, $3)
     RETURNING *`,
    [orgId, name, sort_order ?? 0]
  );
  return res.rows[0];
}

async function updateCategory(id, data, orgId) {
  const allowed = ["name", "sort_order"];
  const entries = Object.entries(data).filter(
    ([k, v]) => allowed.includes(k) && v !== undefined
  );
  if (entries.length === 0) {
    const err = new Error("No fields to update");
    err.statusCode = 400;
    throw err;
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
    `UPDATE service_categories SET ${setClauses.join(", ")}
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

async function removeCategory(id, orgId) {
  // Set null on services that reference this category
  await pool.query(
    `UPDATE services SET category_id = NULL
     WHERE category_id = $1 AND organization_id = $2`,
    [id, orgId]
  );
  const res = await pool.query(
    `DELETE FROM service_categories WHERE id = $1 AND organization_id = $2`,
    [id, orgId]
  );
  if (res.rowCount === 0) {
    const err = new Error("Not found");
    err.statusCode = 404;
    throw err;
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getAllCategories,
  createCategory,
  updateCategory,
  removeCategory,
};
