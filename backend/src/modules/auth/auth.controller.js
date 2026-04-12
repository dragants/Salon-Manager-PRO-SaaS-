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

module.exports = { register, login };
