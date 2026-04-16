const pool = require("../../config/db");
const env = require("../../config/env");
const paddleService = require("../../services/paddle.service");
const planLimits = require("../../services/plan-limits.service");

/** Kolone stripe_* u bazi čuvaju Paddle user_id i subscription_id (Classic). */
async function status(req, res) {
  const r = await pool.query(
    `SELECT subscription_status, stripe_customer_id, stripe_subscription_id
     FROM organizations WHERE id = $1`,
    [req.user.orgId]
  );
  const row = r.rows[0] || {};
  let client_limits = null;
  let appointment_limits = null;
  try {
    client_limits = await planLimits.getClientLimitState(req.user.orgId);
  } catch {
    client_limits = null;
  }
  try {
    appointment_limits = await planLimits.getAppointmentLimitState(
      req.user.orgId
    );
  } catch {
    appointment_limits = null;
  }
  res.json({
    subscription_status: row.subscription_status ?? null,
    has_customer: Boolean(row.stripe_customer_id),
    has_subscription: Boolean(row.stripe_subscription_id),
    subscription_enforced: process.env.SUBSCRIPTION_ENFORCED === "true",
    plan_limits_enforced: env.PLAN_LIMITS_ENFORCED,
    client_limits,
    appointment_limits,
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
