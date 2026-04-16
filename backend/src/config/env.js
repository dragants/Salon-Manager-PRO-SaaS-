const path = require("path");

require("dotenv").config();

const UPLOAD_ROOT = path.resolve(
  process.cwd(),
  process.env.UPLOAD_ROOT || "uploads"
);

module.exports = {
  PORT: process.env.PORT || 5000,
  /** 0.0.0.0 = slušaj na svim interfejsima (LAN, Wi‑Fi, Ethernet). */
  HOST: process.env.HOST || "0.0.0.0",
  JWT_SECRET: process.env.JWT_SECRET,
  UPLOAD_ROOT,
  /**
   * Javni URL frontenda za link u mejlu reset lozinke (npr. https://app.domen.com).
   */
  PASSWORD_RESET_PUBLIC_URL:
    process.env.PASSWORD_RESET_PUBLIC_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000",
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
  PAID_TIER_MAX_CLIENTS: Math.max(
    1,
    Number(process.env.PAID_TIER_MAX_CLIENTS) || 10_000
  ),
  /** Maks. novih termina u tekućem kalendarskom mesecu (timezone salona), free tier. */
  FREE_TIER_MAX_APPOINTMENTS_PER_MONTH: Math.max(
    1,
    Number(process.env.FREE_TIER_MAX_APPOINTMENTS_PER_MONTH) || 200
  ),
  PAID_TIER_MAX_APPOINTMENTS_PER_MONTH: Math.max(
    1,
    Number(process.env.PAID_TIER_MAX_APPOINTMENTS_PER_MONTH) || 100_000
  ),
  APP_TIMEZONE: process.env.APP_TIMEZONE || "Europe/Belgrade",
};
