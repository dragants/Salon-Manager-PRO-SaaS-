const path = require("path");

require("dotenv").config();

const UPLOAD_ROOT = path.resolve(
  process.cwd(),
  process.env.UPLOAD_ROOT || "uploads"
);

module.exports = {
  PORT: process.env.PORT || 5000,
  /** 0.0.0.0 = slušaj na svim interfejsima (LAN, Wi‑Fi, Ethernet). */
  HOST: process.env.HOST || "0.0.0.0",
  JWT_SECRET: process.env.JWT_SECRET,
  UPLOAD_ROOT,
};
