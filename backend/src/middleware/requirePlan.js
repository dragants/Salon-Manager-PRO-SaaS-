const pool = require("../config/db");

/**
 * Plan gating middleware (SaaS control).
 * Uses organizations.billing_plan as the current plan source-of-truth.
 */
function requirePlan(plan) {
  return async (req, res, next) => {
    try {
      const orgId = req.user?.orgId ?? req.user?.tenantId;
      const r = await pool.query(
        `SELECT billing_plan FROM organizations WHERE id = $1`,
        [orgId]
      );
      const cur = r.rows[0]?.billing_plan || "free";
      if (cur !== plan) {
        return res.status(403).json({ error: "Upgrade required" });
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}

module.exports = { requirePlan };

