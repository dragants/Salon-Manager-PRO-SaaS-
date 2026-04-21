/**
 * Brute-force i abuse zaštita — jedan izvor vrednosti za auth rute.
 *
 * - Login: oštri prozor, samo neuspešni pokušaji (skipSuccessfulRequests).
 * - Register / forgot / reset: umereno — sprečava masovne naloga e-mail cikluse.
 * - Global limiter u app.js ne broji /auth; IP se i dalje štiti isključivo ovim.
 */

const AUTH_WINDOW_MS = 15 * 60 * 1000;

/** Maks. neuspešnih prijava / IP / 15 min (deljeni poslovni Wi‑Fi vs. sigurnost). */
const AUTH_LOGIN_MAX_FAILED = 15;

/** Maks. zahteva / IP / 15 min za register, forgot-password, reset-password. */
const AUTH_OTHER_MAX = 25;

/** Globalni “široki” prozor (app.js) — zadržano izvan ovog fajla zbog ostalih ruta. */
const GLOBAL_WINDOW_MS = 15 * 60 * 1000;
const GLOBAL_MAX = 500;

module.exports = {
  AUTH_WINDOW_MS,
  AUTH_LOGIN_MAX_FAILED,
  AUTH_OTHER_MAX,
  GLOBAL_WINDOW_MS,
  GLOBAL_MAX,
};
