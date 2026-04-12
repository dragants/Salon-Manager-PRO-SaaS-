const pool = require("../../config/db");
const paddleService = require("../../services/paddle.service");

/** Kolone stripe_* u bazi čuvaju Paddle user_id i subscription_id (Classic). */
async function status(req, res) {
  const r = await pool.query(
    `SELECT subscription_status, stripe_customer_id, stripe_subscription_id
     FROM organizations WHERE id = $1`,
    [req.user.orgId]
  );
  const row = r.rows[0] || {};
  res.json({
    subscription_status: row.subscription_status ?? null,
    has_customer: Boolean(row.stripe_customer_id),
    has_subscription: Boolean(row.stripe_subscription_id),
    subscription_enforced: process.env.SUBSCRIPTION_ENFORCED === "true",
  });
}

async function checkout(req, res) {
  const { url } = await paddleService.createCheckoutSession(req.user.orgId);
  res.json({ url });
}

async function portal(req, res) {
  const { url } = await paddleService.createBillingPortalSession(req.user.orgId);
  res.json({ url });
}

module.exports = { status, checkout, portal };
