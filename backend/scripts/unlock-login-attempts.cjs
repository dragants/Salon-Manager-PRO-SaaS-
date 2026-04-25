/**
 * Briše Redis ključeve za login brute-force limitere (nakon mnogo pogrešnih prijava).
 *
 * - rate-limiter-flexible: prefix `login_fail:` (vidi loginProtection.js)
 * - express-rate-limit (auth login): prefix `auth:login:` (vidi rateLimitRedisStore.js)
 *
 * Ako nema Redis-a (REDIS_DISABLED=true), limit je u RAM-u — restartuj Node backend.
 *
 * Upotreba (iz foldera backend):
 *   npm run login:unlock
 */

const path = require("path");
const Redis = require("ioredis");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

function buildRedisOptions() {
  const url = process.env.REDIS_URL && String(process.env.REDIS_URL).trim();
  if (url) {
    return url;
  }
  return {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  };
}

async function scanDel(r, pattern) {
  let cursor = "0";
  let deleted = 0;
  do {
    const [next, keys] = await r.scan(cursor, "MATCH", pattern, "COUNT", 200);
    cursor = next;
    if (keys.length > 0) {
      deleted += await r.del(...keys);
    }
  } while (cursor !== "0");
  return deleted;
}

async function main() {
  if (process.env.REDIS_DISABLED === "true") {
    console.log(
      "Redis je isključen (REDIS_DISABLED=true). Login limit je u RAM-u tog Node procesa — zaustavi i ponovo pokreni backend (npr. Ctrl+C pa npm start)."
    );
    process.exit(0);
  }

  const r = new Redis(buildRedisOptions(), {
    maxRetriesPerRequest: 2,
    lazyConnect: true,
  });
  await r.connect();

  try {
    const a = await scanDel(r, "login_fail:*");
    const b = await scanDel(r, "auth:login:*");
    const n = a + b;
    if (n > 0) {
      console.log(
        `Obrisano ${n} ključeva (login_fail:*: ${a}, auth:login:*: ${b}). Probaj prijavu ponovo.`
      );
    } else {
      console.log(
        "U Redis-u nema ključeva login_fail:* ni auth:login:*.\n" +
          "  • Ako backend koristi memorijski limiter (npr. REDIS_DISABLED=true ili Redis nedostupan pri startu), brojači žive u RAM-u tog Node procesa — uradi Ctrl+C na backendu pa ponovo npm start.\n" +
          "  • Ako koristiš drugi Redis nego u backend/.env, skripta gleda pogrešnu instancu — uskladi REDIS_URL / REDIS_HOST."
      );
    }
  } finally {
    r.disconnect();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
