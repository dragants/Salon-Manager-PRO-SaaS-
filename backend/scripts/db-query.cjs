/**
 * Jednokratni SQL protiv baze iz backend/.env (DATABASE_URL).
 * Primer (iz foldera backend):
 *   npm run db:query -- "SELECT id, email, role FROM users LIMIT 5"
 */

const path = require("path");
const { Client } = require("pg");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const url = process.env.DATABASE_URL;
if (!url || typeof url !== "string") {
  console.error("DATABASE_URL nije postavljen u backend/.env");
  process.exit(1);
}

const sql = process.argv.slice(2).join(" ").trim();
if (!sql) {
  console.error(
    "Upotreba: npm run db:query -- \"<SQL>\"\n" +
      "Primer: npm run db:query -- \"SELECT id, email, role FROM users LIMIT 3\""
  );
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const res = await client.query(sql);
    if (res.rows && res.rows.length > 0) {
      console.table(res.rows);
    } else {
      console.log("Nema redova (ili je komanda bez rezultata).");
    }
    if (typeof res.rowCount === "number" && res.command && res.command !== "SELECT") {
      console.log("rowCount:", res.rowCount);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
