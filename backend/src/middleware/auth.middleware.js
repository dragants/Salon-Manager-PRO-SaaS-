const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { JWT_SECRET } = require("../config/env");

function subscriptionBypass(req) {
  const path = req.originalUrl.split("?")[0];
  const method = req.method.toUpperCase();
  if (path === "/health") {
    return true;
  }
  if (path.startsWith("/auth/")) {
    return true;
  }
  if (path.startsWith("/webhooks/paddle")) {
    return true;
  }
  if (
    path.startsWith("/billing/checkout") ||
    path.startsWith("/billing/status") ||
    path.startsWith("/billing/portal")
  ) {
    return true;
  }
  if (path.startsWith("/organizations/me/settings") && method === "GET") {
    return true;
  }
  if (path.startsWith("/users/me") && method === "GET") {
    return true;
  }
  if (path === "/users" && method === "GET") {
    return true;
  }
  return false;
}

module.exports = async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;
    if (userId == null) {
      return res.status(401).json({ error: "Invalid token" });
    }

    let dbTv = 0;
    try {
      const r = await pool.query(
        `SELECT COALESCE(token_version, 0)::int AS tv FROM users WHERE id = $1`,
        [userId]
      );
      if (r.rows.length === 0) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      dbTv = r.rows[0].tv;
    } catch (e) {
      if (e.code !== "42703") {
        throw e;
      }
      const r = await pool.query(`SELECT 1 FROM users WHERE id = $1`, [
        userId,
      ]);
      if (r.rows.length === 0) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      dbTv = 0;
    }
    const jwtTv = decoded.tv !== undefined && decoded.tv !== null ? decoded.tv : 0;
    if (dbTv !== jwtTv) {
      return res.status(401).json({
        error: "Sesija više nije važeća. Prijavi se ponovo.",
        code: "SESSION_REVOKED",
      });
    }

    req.user = decoded;

    if (process.env.SUBSCRIPTION_ENFORCED === "true") {
      if (!subscriptionBypass(req)) {
        let orgR;
        try {
          orgR = await pool.query(
            `SELECT subscription_status FROM organizations WHERE id = $1`,
            [decoded.orgId]
          );
        } catch (e) {
          if (e.code === "42703") {
            return next();
          }
          throw e;
        }
        const st = orgR.rows[0]?.subscription_status;
        const ok = st === "active" || st === "trialing";
        if (!ok) {
          return res.status(403).json({
            error: "Potrebna je aktivna pretplata.",
            code: "SUBSCRIPTION_REQUIRED",
          });
        }
      }
    }

    next();
  } catch (e) {
    if (e.name === "JsonWebTokenError" || e.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    next(e);
  }
};
