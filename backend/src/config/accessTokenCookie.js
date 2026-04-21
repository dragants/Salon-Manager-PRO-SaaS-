const { NODE_ENV } = require("./env");

const ACCESS_TOKEN_COOKIE = "access_token";

/**
 * httpOnly kolačić sa JWT — vidi frontend `withCredentials` + CORS `credentials: true`.
 * U produkciji: Secure + SameSite=None (različiti poddomen ili port od frontenda).
 * Lokalno: Secure=false, SameSite=Lax (Chrome tretira localhost kao isti „site“ za više portova).
 */
function accessTokenCookieOptions(maxAgeMs) {
  const forceSecure = process.env.COOKIE_SECURE === "true";
  const forceInsecure = process.env.COOKIE_INSECURE === "true";
  const secure =
    forceSecure || (NODE_ENV === "production" && !forceInsecure);
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    maxAge: maxAgeMs,
    path: "/",
  };
}

/** Kratka sesija (tab) — 12h; „Zapamti me“ — 7 dana kao JWT u utils/jwt.js */
const REMEMBER_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;

module.exports = {
  ACCESS_TOKEN_COOKIE,
  accessTokenCookieOptions,
  REMEMBER_MAX_AGE_MS,
  SESSION_MAX_AGE_MS,
};
