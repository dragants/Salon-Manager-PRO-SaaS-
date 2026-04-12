const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");

function generate(payload) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

module.exports = { generate };
