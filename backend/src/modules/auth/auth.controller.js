const authService = require("./auth.service");
const twofaService = require("./auth.2fa.service");
const jwt = require("jsonwebtoken");
const pool = require("../../config/db");
const { generate } = require("../../utils/jwt");
const { JWT_SECRET } = require("../../config/env");
const { resetLoginFailures } = require("../../middleware/loginProtection");
const {
  ACCESS_TOKEN_COOKIE,
  accessTokenCookieOptions,
  REMEMBER_MAX_AGE_MS,
  SESSION_MAX_AGE_MS,
} = require("../../config/accessTokenCookie");

function setAccessTokenCookie(res, token, remember) {
  const maxAge = remember !== false ? REMEMBER_MAX_AGE_MS : SESSION_MAX_AGE_MS;
  res.cookie(ACCESS_TOKEN_COOKIE, token, accessTokenCookieOptions(maxAge));
}

async function register(req, res) {
  const token = await authService.register(req.body);
  setAccessTokenCookie(res, token, true);
  res.status(201).json({ ok: true });
}

async function login(req, res) {
  const remember = req.body?.remember !== false;
  const token = await authService.login(req.body);
  if (!token) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  // On successful login, clear brute-force counter.
  await resetLoginFailures({ email: req.body?.email, ip: req.ip });
  setAccessTokenCookie(res, token, remember);
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    decoded = null;
  }
  const mfa = decoded?.mfa !== false;
  res.json({
    ok: true,
    mfa_required: decoded?.mfa === false,
    mfa: mfa,
  });
}

function logout(req, res) {
  const o = accessTokenCookieOptions(0);
  res.clearCookie(ACCESS_TOKEN_COOKIE, {
    path: o.path,
    httpOnly: true,
    secure: o.secure,
    sameSite: o.sameSite,
  });
  res.json({ ok: true });
}

async function forgotPassword(req, res) {
  await authService.requestPasswordReset(req.body);
  res.json({
    ok: true,
    message:
      "Ako nalog postoji, poslali smo uputstvo na e-adresu (proveri i spam).",
  });
}

async function resetPassword(req, res) {
  await authService.resetPassword(req.body);
  res.json({ ok: true, message: "Lozinka je ažurirana. Možete se prijaviti." });
}

async function begin2faSetup(req, res) {
  const out = await twofaService.beginSetup({ userId: req.user.userId });
  res.json(out);
}

async function enable2fa(req, res) {
  const out = await twofaService.enable({
    userId: req.user.userId,
    otp: req.body.otp,
  });

  /**
   * Kada je korisnik bio u "MFA pending" sesiji (jwt mfa=false), omogućavanje 2FA
   * treba da ga odmah prebaci u punu sesiju (mfa=true) — bez odjave/prijave.
   */
  try {
    const r = await pool.query(
      `SELECT id,
              organization_id,
              role,
              COALESCE(token_version, 0)::int AS token_version
       FROM users WHERE id = $1`,
      [req.user.userId]
    );
    const u = r.rows[0];
    if (u) {
      const token = generate({
        userId: u.id,
        orgId: u.organization_id,
        tenantId: u.organization_id,
        role: u.role,
        tv: u.token_version,
        mfa: true,
      });
      // posle enable2fa uvek postavi "remember" cookie (7d) kao praktičan default
      setAccessTokenCookie(res, token, true);
    }
  } catch {
    // ignore; fallback je da klijent uradi re-login
  }

  res.json(out);
}

async function verify2fa(req, res) {
  const out = await twofaService.verify({
    userId: req.user.userId,
    otp: req.body.otp,
  });
  // upgrade session to mfa=true
  const r = await pool.query(
    `SELECT id,
            organization_id,
            role,
            COALESCE(token_version, 0)::int AS token_version
     FROM users WHERE id = $1`,
    [req.user.userId]
  );
  const u = r.rows[0];
  const token = generate({
    userId: u.id,
    orgId: u.organization_id,
    tenantId: u.organization_id,
    role: u.role,
    tv: u.token_version,
    mfa: true,
  });
  setAccessTokenCookie(res, token, true);
  res.json({ ok: true, ...out });
}

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  begin2faSetup,
  enable2fa,
  verify2fa,
};
