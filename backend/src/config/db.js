const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString || typeof connectionString !== "string") {
  throw new Error(
    "DATABASE_URL nije postavljen. Učitaj backend/.env pre importa baze (vidi server.js)."
  );
}

const pool = new Pool({
  connectionString,
});

module.exports = pool;
