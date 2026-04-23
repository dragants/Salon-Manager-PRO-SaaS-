const pool = require("../config/db");
const { getStripe } = require("../config/stripe");
const { FRONTEND_URLS } = require("../config/env");

function resolveFrontendBaseUrl() {
  const fromEnv = (process.env.FRONTEND_URL || "").split(",").map((s) => s.trim()).filter(Boolean)[0];
  const base = fromEnv || FRONTEND_URLS?.[0] || "http://localhost:3000";
  return String(base).replace(/\/$/, "");
}

async function ensureCustomerForOrg(orgId) {
  const r = await pool.query(
    `SELECT id, name, stripe_customer_id FROM organizations WHERE id = $1`,
    [orgId]
  );
  if (r.rows.length === 0) {
    const err = new Error("Organization not found");
    err.statusCode = 404;
    throw err;
  }
  const org = r.rows[0];
  if (org.stripe_customer_id) {
    return { orgName: org.name, customerId: org.stripe_customer_id };
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    name: org.name,
    metadata: {
      organization_id: String(orgId),
      tenantId: String(orgId),
    },
  });

  await pool.query(
    `UPDATE organizations SET stripe_customer_id = $1 WHERE id = $2`,
    [customer.id, orgId]
  );

  return { orgName: org.name, customerId: customer.id };
}

async function createCheckoutSessionForOrg(orgId) {
  const stripe = getStripe();
  const { customerId } = await ensureCustomerForOrg(orgId);

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    const err = new Error("STRIPE_PRICE_ID is not set");
    err.statusCode = 500;
    throw err;
  }

  const baseSuccess = (process.env.STRIPE_SUCCESS_URL || "").trim();
  const baseCancel = (process.env.STRIPE_CANCEL_URL || "").trim();
  const fb = resolveFrontendBaseUrl();
  const success_url = baseSuccess || `${fb}/settings/billing?success=1`;
  const cancel_url = baseCancel || `${fb}/settings/billing?cancel=1`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url,
    cancel_url,
    metadata: {
      organization_id: String(orgId),
      tenantId: String(orgId),
    },
  });

  // Keep a pointer row (optional, but helpful)
  try {
    await pool.query(
      `INSERT INTO stripe_subscriptions (organization_id, stripe_customer_id, plan, status)
       VALUES ($1, $2, NULL, 'pending')
       ON CONFLICT (organization_id) DO UPDATE SET stripe_customer_id = EXCLUDED.stripe_customer_id`,
      [orgId, customerId]
    );
  } catch {
    /* ignore if migration not applied yet */
  }

  return { url: session.url };
}

async function createPortalSessionForOrg(orgId) {
  const stripe = getStripe();
  const { customerId } = await ensureCustomerForOrg(orgId);

  const return_url =
    (process.env.STRIPE_PORTAL_RETURN_URL || "").trim() ||
    `${resolveFrontendBaseUrl()}/settings/billing`;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url,
  });

  return { url: session.url };
}

module.exports = { createCheckoutSessionForOrg, createPortalSessionForOrg };


