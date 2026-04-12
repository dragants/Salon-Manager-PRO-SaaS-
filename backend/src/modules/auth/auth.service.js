const pool = require("../../config/db");
const { generate } = require("../../utils/jwt");
const { hashPassword, comparePassword } = require("../../utils/hash");

async function register({ email, password, organization_name }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const orgResult = await client.query(
      "INSERT INTO organizations(name) VALUES($1) RETURNING id",
      [organization_name]
    );
    const orgId = orgResult.rows[0].id;

    const hashed = await hashPassword(password);

    const userResult = await client.query(
      `INSERT INTO users(email, password, organization_id, role)
       VALUES($1, $2, $3, 'admin') RETURNING id`,
      [email, hashed, orgId]
    );

    await client.query("COMMIT");

    return generate({
      userId: userResult.rows[0].id,
      orgId,
      role: "admin",
      tv: 0,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function login({ email, password }) {
  let result;
  try {
    result = await pool.query(
      `SELECT id, password, organization_id, role,
              COALESCE(token_version, 0)::int AS token_version
       FROM users WHERE email = $1`,
      [email]
    );
  } catch (e) {
    if (e.code !== "42703") {
      throw e;
    }
    result = await pool.query(
      `SELECT id, password, organization_id, role
       FROM users WHERE email = $1`,
      [email]
    );
  }
  if (result.rows.length === 0) {
    return null;
  }
  const user = result.rows[0];
  if (user.token_version === undefined) {
    user.token_version = 0;
  }
  const ok = await comparePassword(password, user.password);
  if (!ok) {
    return null;
  }
  return generate({
    userId: user.id,
    orgId: user.organization_id,
    role: user.role,
    tv: user.token_version,
  });
}

module.exports = { register, login };
