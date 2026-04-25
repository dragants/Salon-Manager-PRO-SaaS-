/**
 * TOTP secret iz PostgreSQL-a ponekad stigne kao Buffer ili sa nevidljivim razmacima
 * (zero-width space) — authenticator.check onda pada iako je kod tačan.
 */
function normalizeTotpSecret(raw) {
  if (raw == null) {
    return "";
  }
  let s = Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw);
  s = s.trim().replace(/[\u200b\u200c\u200d\ufeff\u00a0]/g, "");
  return s;
}

/** Uklanja sve whitespace u OTP (npr. "492 508" → "492508"). */
function normalizeTotpCodeInput(raw) {
  if (raw == null) {
    return "";
  }
  return String(raw).replace(/\s+/g, "").trim();
}

module.exports = { normalizeTotpSecret, normalizeTotpCodeInput };
