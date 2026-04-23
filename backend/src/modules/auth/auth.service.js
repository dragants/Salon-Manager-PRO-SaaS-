const crypto = require("crypto");
const pool = require("../../config/db");
const env = require("../../config/env");
const { generate } = require("../../utils/jwt");
const { hashPassword, comparePassword } = require("../../utils/hash");
const { sendPasswordResetEmail } = require("../../services/auth-mail.service");
const { authenticator } = require("otplib");

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
      tenantId: orgId,
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

async function login({ email, password, remember: _remember, otp }) {
  let result;
  try {
    result = await pool.query(
      `SELECT id, password, organization_id, role,
              COALESCE(token_version, 0)::int AS token_version,
              COALESCE(twofa_enabled, false) AS twofa_enabled,
              twofa_secret,
              COALESCE(mfa_enforced, false) AS mfa_enforced
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

  const role = user.role;
  const isPrivileged = role === "owner" || role === "admin";
  const enforceMfa = Boolean(user.mfa_enforced) || isPrivileged;

  // MFA handling:
  // - If enforced and not enabled: issue a limited token with mfa=false so user can complete setup.
  // - If enabled: require valid OTP to issue full token (mfa=true).
  if (enforceMfa && user.twofa_enabled) {
    const code = otp != null ? String(otp).trim() : "";
    const secret = user.twofa_secret ? String(user.twofa_secret) : "";
    const okOtp =
      code && secret ? authenticator.check(code, secret) : false;
    if (!okOtp) {
      const err = new Error("Invalid 2FA code");
      err.statusCode = 401;
      err.code = "MFA_INVALID";
      throw err;
    }
  }

  return generate({
    userId: user.id,
    orgId: user.organization_id,
    tenantId: user.organization_id,
    role,
    tv: user.token_version,
    mfa: !enforceMfa ? true : Boolean(user.twofa_enabled),
  });
}

/**
 * Uvek vraća uspeh (bez otkrivanja da li email postoji).
 * @param {{ email: string }} param0
 */
async function requestPasswordReset({ email }) {
  let result;
  try {
    result = await pool.query(
      `SELECT id, email FROM users WHERE lower(trim(email)) = lower(trim($1))`,
      [email]
    );
  } catch (e) {
    if (e.code !== "42703") {
      throw e;
    }
    return { ok: true };
  }

  if (result.rows.length === 0) {
    return { ok: true };
  }

  const user = result.rows[0];
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  try {
    await pool.query(
      `UPDATE users
       SET password_reset_token_hash = $1,
           password_reset_expires_at = $2
       WHERE id = $3`,
      [hash, expires, user.id]
    );
  } catch (e) {
    if (e.code === "42703") {
      const err = new Error(
        "Migracija baze nije primenjena (013_users_password_reset)."
      );
      err.statusCode = 503;
      throw err;
    }
    throw e;
  }

  const base = String(env.PASSWORD_RESET_PUBLIC_URL || "").replace(/\/$/, "");
  const link = `${base}/reset-password?token=${encodeURIComponent(raw)}`;
  await sendPasswordResetEmail(user.email, link);
  return { ok: true };
}

/**
 * @param {{ token: string; password: string }} param0
 */
async function resetPassword({ token, password }) {
  if (!token || String(token).length < 16) {
    const err = new Error("Nevažeći link.");
    err.statusCode = 400;
    throw err;
  }
  const hash = crypto.createHash("sha256").update(String(token)).digest("hex");

  let result;
  try {
    result = await pool.query(
      `SELECT id FROM users
       WHERE password_reset_token_hash = $1
         AND password_reset_expires_at IS NOT NULL
         AND password_reset_expires_at > NOW()`,
      [hash]
    );
  } catch (e) {
    if (e.code === "42703") {
      const err = new Error(
        "Migracija baze nije primenjena (013_users_password_reset)."
      );
      err.statusCode = 503;
      throw err;
    }
    throw e;
  }

  if (result.rows.length === 0) {
    const err = new Error("Link nije validan ili je istekao. Zatražite novi.");
    err.statusCode = 400;
    throw err;
  }

  const userId = result.rows[0].id;
  const hashed = await hashPassword(password);

  await pool.query(
    `UPDATE users
     SET password = $1,
         password_reset_token_hash = NULL,
         password_reset_expires_at = NULL,
         token_version = COALESCE(token_version, 0) + 1
     WHERE id = $2`,
    [hashed, userId]
  );

  return { ok: true };
}

module.exports = { register, login, requestPasswordReset, resetPassword };
