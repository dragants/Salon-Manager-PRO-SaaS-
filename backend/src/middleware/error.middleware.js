module.exports = function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  } else {
    console.error(err);
  }

  if (err.message === "JWT_SECRET is not set") {
    return res.status(500).json({
      error:
        "Backend nije podešen: u backend/.env postavi JWT_SECRET (vidi .env.example).",
    });
  }

  if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
    return res.status(503).json({
      error: isProduction
        ? "Servis privremeno nedostupan."
        : "PostgreSQL nije dostupan. Proveri da li je baza uključena i DATABASE_URL u backend/.env.",
    });
  }

  if (err.code === "28P01" || err.code === "3D000") {
    return res.status(503).json({
      error: isProduction
        ? "Servis privremeno nedostupan."
        : "Greška prijave u bazu (korisnik, lozinka ili ime baze). Proveri DATABASE_URL.",
    });
  }

  if (err.code === "42P01") {
    return res.status(503).json({
      error: isProduction
        ? "Servis privremeno nedostupan."
        : "Tabele u bazi ne postoje. Pokreni backend/sql/schema.sql na PostgreSQL bazi (ili migracije u backend/sql/migrations/).",
    });
  }

  /** Npr. kolona category_id na services — šema starija od aplikacije */
  if (err.code === "42703") {
    return res.status(503).json({
      error: isProduction
        ? "Servis privremeno nedostupan."
        : "Baza nema očekivane kolone (šema je starija od aplikacije). U folderu backend pokreni: npm run migrate:018-021 — ili psql -f sql/schema.sql / pojedinačne migracije 018–021.",
    });
  }

  if (err.code === "23505") {
    return res.status(409).json({ error: "Resurs već postoji." });
  }

  if (err.code === "23503") {
    return res.status(400).json({
      error: "Nevažeća referenca (klijent/usluga ne postoji).",
    });
  }

  if (err.apiCode) {
    return res.status(err.statusCode || 403).json({
      error: err.message || "Zabranjeno",
      code: err.apiCode,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  const status = err.statusCode || err.status;
  if (status && status !== 500) {
    return res.status(status).json({ error: err.message || "Error" });
  }

  res.status(500).json({
    error: isProduction
      ? "Interna greška servera."
      : err.message || "Internal server error",
  });
};
