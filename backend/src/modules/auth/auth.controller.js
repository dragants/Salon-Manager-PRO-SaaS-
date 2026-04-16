const authService = require("./auth.service");

async function register(req, res) {
  const token = await authService.register(req.body);
  res.status(201).json({ token });
}

async function login(req, res) {
  const token = await authService.login(req.body);
  if (!token) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  res.json({ token });
}

async function forgotPassword(req, res) {
  await authService.requestPasswordReset(req.body);
  res.json({
    ok: true,
    message:
      "Ako nalog postoji, poslali smo uputstvo na e-adresu (proveri i spam).",
  });
}

async function resetPassword(req, res) {
  await authService.resetPassword(req.body);
  res.json({ ok: true, message: "Lozinka je ažurirana. Možete se prijaviti." });
}

module.exports = { register, login, forgotPassword, resetPassword };
