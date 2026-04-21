const authService = require("./auth.service");
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
  setAccessTokenCookie(res, token, remember);
  res.json({ ok: true });
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

module.exports = { register, login, logout, forgotPassword, resetPassword };
