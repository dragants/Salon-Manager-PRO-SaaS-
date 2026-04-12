/**
 * Izvršava jedan .sql fajl protiv baze iz DATABASE_URL (backend/.env).
 * Primer (iz foldera backend):
 *   node scripts/run-sql-migration.cjs sql/migrations/011_work_shifts.sql
 */

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const url = process.env.DATABASE_URL;
if (!url || typeof url !== "string") {
  console.error("DATABASE_URL nije postavljen u backend/.env");
  process.exit(1);
}

const rel = process.argv[2];
if (!rel) {
  console.error(
    "Upotreba: node scripts/run-sql-migration.cjs <putanja-do-fajla.sql>\n" +
      "Primer: node scripts/run-sql-migration.cjs sql/migrations/011_work_shifts.sql"
  );
  process.exit(1);
}

const file = path.isAbsolute(rel) ? rel : path.join(__dirname, "..", rel);
if (!fs.existsSync(file)) {
  console.error("Fajl ne postoji:", file);
  process.exit(1);
}

const sql = fs.readFileSync(file, "utf8");

async function main() {
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(sql);
    console.log("OK:", path.relative(process.cwd(), file));
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
