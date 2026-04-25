const path = require("path");

require("dotenv").config();

const UPLOAD_ROOT = path.resolve(
  process.cwd(),
  process.env.UPLOAD_ROOT || "uploads"
);

const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";

/** Javni URL(ovi) frontenda za CORS i CSRF proveru — zarezom odvojeni. */
let FRONTEND_URLS = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);
if (FRONTEND_URLS.length === 0) {
  FRONTEND_URLS = ["http://localhost:3000"];
}

const JWT_SECRET = process.env.JWT_SECRET;

if (isProduction) {
  if (!JWT_SECRET || String(JWT_SECRET).length < 32) {
    throw new Error(
      "JWT_SECRET must be set to a random string of at least 32 characters in production."
    );
  }
} else if (!JWT_SECRET || String(JWT_SECRET).length < 16) {
  console.warn(
    "[env] JWT_SECRET is missing or short — set a strong secret before production."
  );
}

module.exports = {
  NODE_ENV,
  PORT: process.env.PORT || 5000,
  /**
   * Podrazumevano slušaj i IPv4 i IPv6.
   * Na Windowsu `localhost` često ode na `::1`; ako slušamo samo 0.0.0.0,
   * browser može da dobije `ERR_CONNECTION_REFUSED` na API.
   */
  HOST: process.env.HOST || "::",
  JWT_SECRET,
  /** Za CORS `origin` i provera `Origin` zaglavlja. */
  FRONTEND_URLS,
  UPLOAD_ROOT,
  /**
   * Javni URL frontenda za link u mejlu reset lozinke (npr. https://app.domen.com).
   */
  PASSWORD_RESET_PUBLIC_URL:
    process.env.PASSWORD_RESET_PUBLIC_URL || FRONTEND_URLS[0] || "http://localhost:3000",
  /** Opcioni SMTP za sistem mejlove (reset lozinke). Ako nije podešen, link se loguje u konzolu (dev). */
  APP_SMTP_HOST: process.env.APP_SMTP_HOST || "",
  APP_SMTP_PORT: Number(process.env.APP_SMTP_PORT) || 587,
  APP_SMTP_SECURE: process.env.APP_SMTP_SECURE === "true",
  APP_SMTP_USER: process.env.APP_SMTP_USER || "",
  APP_SMTP_PASS: process.env.APP_SMTP_PASS || "",
  APP_SMTP_FROM: process.env.APP_SMTP_FROM || "",
  /**
   * Limiti po planu (besplatno vs aktivna pretplata).
   * U produkciji postavi PLAN_LIMITS_ENFORCED=true.
   */
  PLAN_LIMITS_ENFORCED: process.env.PLAN_LIMITS_ENFORCED === "true",
  FREE_TIER_MAX_CLIENTS: Math.max(
    1,
    Number(process.env.FREE_TIER_MAX_CLIENTS) || 50
  ),
  /** @deprecated koristi PRO_TIER_MAX_CLIENTS */
  PAID_TIER_MAX_CLIENTS: Math.max(
    1,
    Number(process.env.PAID_TIER_MAX_CLIENTS) || 10_000
  ),
  BASIC_TIER_MAX_CLIENTS: Math.max(
    1,
    Number(process.env.BASIC_TIER_MAX_CLIENTS) || 500
  ),
  PRO_TIER_MAX_CLIENTS: Math.max(
    1,
    Number(process.env.PRO_TIER_MAX_CLIENTS) ||
      Number(process.env.PAID_TIER_MAX_CLIENTS) ||
      10_000
  ),
  /** Maks. termina u tekućem mesecu (timezone salona) — free. */
  FREE_TIER_MAX_APPOINTMENTS_PER_MONTH: Math.max(
    1,
    Number(process.env.FREE_TIER_MAX_APPOINTMENTS_PER_MONTH) || 200
  ),
  BASIC_TIER_MAX_APPOINTMENTS_PER_MONTH: Math.max(
    1,
    Number(process.env.BASIC_TIER_MAX_APPOINTMENTS_PER_MONTH) || 2000
  ),
  PRO_TIER_MAX_APPOINTMENTS_PER_MONTH: Math.max(
    1,
    Number(process.env.PRO_TIER_MAX_APPOINTMENTS_PER_MONTH) ||
      Number(process.env.PAID_TIER_MAX_APPOINTMENTS_PER_MONTH) ||
      100_000
  ),
  APP_TIMEZONE: process.env.APP_TIMEZONE || "Europe/Belgrade",
};
