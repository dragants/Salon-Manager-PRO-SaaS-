/**
 * Pokreće migracije 018–021 (kategorije usluga, supply usage, ponavljanje, cancel token).
 * Zahteva DATABASE_URL u backend/.env
 *
 *   npm run migrate:018-021
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

const files = [
  "sql/migrations/018_service_categories.sql",
  "sql/migrations/019_service_supply_usage.sql",
  "sql/migrations/020_recurring_appointments.sql",
  "sql/migrations/021_appointment_cancel_token.sql",
];

async function main() {
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    for (const rel of files) {
      const file = path.join(__dirname, "..", rel);
      if (!fs.existsSync(file)) {
        throw new Error(`Nedostaje fajl: ${file}`);
      }
      const sql = fs.readFileSync(file, "utf8");
      await client.query(sql);
      console.log("OK:", rel);
    }
    console.log("\nSve migracije 018–021 su primenjene. Restartuj backend (npm start).");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
