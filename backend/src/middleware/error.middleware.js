module.exports = function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err);

  if (err.message === "JWT_SECRET is not set") {
    return res.status(500).json({
      error:
        "Backend nije podešen: u backend/.env postavi JWT_SECRET (vidi .env.example).",
    });
  }

  if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
    return res.status(503).json({
      error:
        "PostgreSQL nije dostupan. Proveri da li je baza uključena i DATABASE_URL u backend/.env.",
    });
  }

  if (err.code === "28P01" || err.code === "3D000") {
    return res.status(503).json({
      error:
        "Greška prijave u bazu (korisnik, lozinka ili ime baze). Proveri DATABASE_URL.",
    });
  }

  if (err.code === "42P01") {
    return res.status(503).json({
      error:
        "Tabele u bazi ne postoje. Pokreni sql/schema.sql na svojoj PostgreSQL bazi.",
    });
  }

  if (err.code === "23505") {
    return res.status(409).json({ error: "Resource already exists" });
  }

  if (err.code === "23503") {
    return res.status(400).json({
      error: "Invalid reference (client/service ne postoji)",
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

  const showDetails = process.env.NODE_ENV !== "production";
  res.status(500).json({
    error: showDetails
      ? err.message || "Internal server error"
      : "Internal server error",
    ...(showDetails && err.code ? { code: err.code } : {}),
  });
};
