const crypto = require("crypto");
const pool = require("../../config/db");
const { authenticator } = require("otplib");
const QRCode = require("qrcode");

const ISSUER = "Salon Manager PRO";

function hashCode(raw) {
  return crypto.createHash("sha256").update(String(raw)).digest("hex");
}

function makeBackupCodes(n = 10) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(crypto.randomBytes(5).toString("hex")); // 10 chars
  }
  return out;
}

async function beginSetup({ userId }) {
  const r = await pool.query(
    `SELECT id,
            email,
            role,
            COALESCE(mfa_enforced, false) AS mfa_enforced,
            COALESCE(twofa_enabled, false) AS twofa_enabled,
            twofa_secret
     FROM users WHERE id = $1`,
    [userId]
  );
  if (r.rows.length === 0) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  const user = r.rows[0];
  if (user.twofa_enabled) {
    const err = new Error("2FA already enabled");
    err.statusCode = 409;
    throw err;
  }

  /**
   * Bitno: ne regenerisati secret na svaki refresh, jer onda Authenticator kodovi
   * nikad ne prolaze (korisnik slučajno skenira stari QR).
   */
  const secret =
    user.twofa_secret && String(user.twofa_secret).trim()
      ? String(user.twofa_secret).trim()
      : authenticator.generateSecret();
  const otpauth_url = authenticator.keyuri(String(user.email), ISSUER, secret);
  const qr = await QRCode.toDataURL(otpauth_url);

  if (!user.twofa_secret || !String(user.twofa_secret).trim()) {
    await pool.query(
      `UPDATE users
       SET twofa_secret = $1,
           twofa_enabled = FALSE
       WHERE id = $2`,
      [secret, userId]
    );
  }

  return {
    otpauth_url,
    secret,
    qr,
    mfa_enforced: Boolean(user.mfa_enforced) || user.role === "admin" || user.role === "owner",
  };
}

async function enable({ userId, otp }) {
  const r = await pool.query(
    `SELECT id, twofa_secret FROM users WHERE id = $1`,
    [userId]
  );
  if (r.rows.length === 0) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  const secret = r.rows[0].twofa_secret ? String(r.rows[0].twofa_secret) : "";
  const code = otp != null ? String(otp).trim() : "";
  if (!secret) {
    const err = new Error("2FA setup not started");
    err.statusCode = 409;
    throw err;
  }
  // Dozvoli malu toleranciju za razliku u vremenu uređaja (±1 interval).
  authenticator.options = { ...authenticator.options, window: 1 };
  const ok = code ? authenticator.check(code, secret) : false;
  if (!ok) {
    const err = new Error("Invalid 2FA code");
    err.statusCode = 400;
    throw err;
  }

  const backupCodes = makeBackupCodes(10);
  const backupHashes = backupCodes.map((c) => hashCode(c));

  await pool.query(
    `UPDATE users
     SET twofa_enabled = TRUE,
         twofa_backup_codes_hash = $1::jsonb
     WHERE id = $2`,
    [JSON.stringify(backupHashes), userId]
  );

  return { ok: true, backup_codes: backupCodes };
}

async function verify({ userId, otp }) {
  const r = await pool.query(
    `SELECT id, COALESCE(twofa_enabled, false) AS twofa_enabled, twofa_secret
     FROM users WHERE id = $1`,
    [userId]
  );
  if (r.rows.length === 0) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  const user = r.rows[0];
  if (!user.twofa_enabled) {
    const err = new Error("2FA not enabled");
    err.statusCode = 409;
    throw err;
  }
  const secret = user.twofa_secret ? String(user.twofa_secret) : "";
  const code = otp != null ? String(otp).trim() : "";
  if (!secret) {
    const err = new Error("2FA secret missing");
    err.statusCode = 409;
    throw err;
  }
  authenticator.options = { ...authenticator.options, window: 1 };
  const ok = code ? authenticator.check(code, secret) : false;
  if (!ok) {
    const err = new Error("Invalid 2FA code");
    err.statusCode = 400;
    throw err;
  }
  return { ok: true };
}

module.exports = { beginSetup, enable, verify };

