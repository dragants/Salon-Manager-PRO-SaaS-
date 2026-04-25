const pool = require("../config/db");
const { getStripe } = require("../config/stripe");

function mapPlanFromPriceId(priceId) {
  const pro = (process.env.STRIPE_PRICE_ID_PRO || "").split(",").map((s) => s.trim()).filter(Boolean);
  const basic = (process.env.STRIPE_PRICE_ID_BASIC || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (pro.includes(priceId)) return "pro";
  if (basic.includes(priceId)) return "basic";
  // default: treat unknown as basic, but you can tighten this later
  return "basic";
}

function tsToDate(ts) {
  if (ts == null) return null;
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n * 1000);
}

async function resolveOrgIdByStripe({ customerId, subscriptionId, metadata }) {
  const metaOrg =
    metadata?.organization_id || metadata?.tenantId || metadata?.tenant_id;
  const orgIdFromMeta = metaOrg != null ? Number(metaOrg) : null;
  if (orgIdFromMeta) {
    return orgIdFromMeta;
  }

  const r = await pool.query(
    `SELECT organization_id FROM stripe_subscriptions
     WHERE stripe_customer_id = $1 OR stripe_subscription_id = $2
     LIMIT 1`,
    [customerId || null, subscriptionId || null]
  );
  return r.rows[0]?.organization_id ?? null;
}

async function upsertStripeSubscriptionForOrg(orgId, payload) {
  await pool.query(
    `INSERT INTO stripe_subscriptions
      (organization_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (organization_id) DO UPDATE SET
       stripe_customer_id = EXCLUDED.stripe_customer_id,
       stripe_subscription_id = EXCLUDED.stripe_subscription_id,
       plan = EXCLUDED.plan,
       status = EXCLUDED.status,
       current_period_end = EXCLUDED.current_period_end`,
    [
      orgId,
      payload.stripe_customer_id || null,
      payload.stripe_subscription_id || null,
      payload.plan || null,
      payload.status || null,
      payload.current_period_end || null,
    ]
  );
}

async function setOrgPlanFromStripe(orgId, { status, plan }) {
  const paid = status === "active" || status === "trialing";
  const nextPlan = paid ? plan || "basic" : "free";
  await pool.query(
    `UPDATE organizations
     SET subscription_status = $1,
         billing_plan = $2
     WHERE id = $3`,
    [status || "inactive", nextPlan, orgId]
  );
}

module.exports = async function stripeWebhook(req, res) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return res.status(503).send("Webhook not configured");
  }

  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (e) {
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }

  try {
    // Idempotency: ignore already-processed webhook event ids.
    // Note: relies on migration `025_stripe_events_idempotency.sql`.
    try {
      const r = await pool.query(
        `INSERT INTO stripe_events (id) VALUES ($1)
         ON CONFLICT (id) DO NOTHING
         RETURNING id`,
        [event.id]
      );
      if (r.rowCount === 0) {
        return res.json({ received: true });
      }
    } catch {
      // If table is missing (migration not applied yet), continue without idempotency.
    }

    if (event.type === "checkout.session.completed") {
      const s = event.data.object;
      const orgId = await resolveOrgIdByStripe({
        customerId: s.customer,
        subscriptionId: s.subscription || null,
        metadata: s?.metadata,
      });
      if (!orgId) {
        return res.status(200).json({ received: true });
      }
      // Customer is known; subscription id may be present depending on mode
      await upsertStripeSubscriptionForOrg(orgId, {
        stripe_customer_id: s.customer,
        stripe_subscription_id: s.subscription || null,
        plan: null,
        status: "trialing",
        current_period_end: null,
      });
    }

    if (event.type === "invoice.payment_succeeded") {
      const inv = event.data.object;
      const customerId = inv.customer;
      const subId = inv.subscription;
      const orgId = await resolveOrgIdByStripe({
        customerId,
        subscriptionId: subId,
        metadata: inv?.metadata,
      });
      if (orgId) {
        const priceId = inv.lines?.data?.[0]?.price?.id || "";
        const plan = mapPlanFromPriceId(String(priceId));
        const periodEnd =
          inv.lines?.data?.[0]?.period?.end != null
            ? tsToDate(inv.lines.data[0].period.end)
            : inv.period_end != null
              ? tsToDate(inv.period_end)
              : null;
        await upsertStripeSubscriptionForOrg(orgId, {
          stripe_customer_id: customerId,
          stripe_subscription_id: subId,
          plan,
          status: "active",
          current_period_end: periodEnd,
        });
        await setOrgPlanFromStripe(orgId, { status: "active", plan });
      }
    }

    if (event.type === "invoice.payment_failed") {
      const inv = event.data.object;
      const customerId = inv.customer;
      const subId = inv.subscription;
      const orgId = await resolveOrgIdByStripe({
        customerId,
        subscriptionId: subId,
        metadata: inv?.metadata,
      });
      if (orgId) {
        await upsertStripeSubscriptionForOrg(orgId, {
          stripe_customer_id: customerId,
          stripe_subscription_id: subId,
          plan: null,
          status: "past_due",
          current_period_end: null,
        });
        await setOrgPlanFromStripe(orgId, { status: "past_due", plan: null });
      }
    }

    if (event.type === "customer.subscription.created") {
      const sub = event.data.object;
      const orgId = await resolveOrgIdByStripe({
        customerId: sub.customer,
        subscriptionId: sub.id,
        metadata: sub?.metadata,
      });
      if (orgId) {
        const priceId = sub.items?.data?.[0]?.price?.id || "";
        const plan = mapPlanFromPriceId(String(priceId));
        const status = sub.status || "inactive";
        const cpe = tsToDate(sub.current_period_end);
        await upsertStripeSubscriptionForOrg(orgId, {
          stripe_customer_id: sub.customer,
          stripe_subscription_id: sub.id,
          plan,
          status,
          current_period_end: cpe,
        });
        await setOrgPlanFromStripe(orgId, { status, plan });
      }
    }

    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object;
      const orgId = await resolveOrgIdByStripe({
        customerId: sub.customer,
        subscriptionId: sub.id,
        metadata: sub?.metadata,
      });
      if (orgId) {
        const priceId = sub.items?.data?.[0]?.price?.id || "";
        const plan = mapPlanFromPriceId(String(priceId));
        const status = sub.status || "inactive";
        const cpe = tsToDate(sub.current_period_end);
        await upsertStripeSubscriptionForOrg(orgId, {
          stripe_customer_id: sub.customer,
          stripe_subscription_id: sub.id,
          plan,
          status,
          current_period_end: cpe,
        });
        await setOrgPlanFromStripe(orgId, { status, plan });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      const orgId = await resolveOrgIdByStripe({
        customerId: sub.customer,
        subscriptionId: sub.id,
        metadata: sub?.metadata,
      });
      if (orgId) {
        await upsertStripeSubscriptionForOrg(orgId, {
          stripe_customer_id: sub.customer,
          stripe_subscription_id: sub.id,
          plan: null,
          status: "canceled",
          current_period_end: null,
        });
        await setOrgPlanFromStripe(orgId, { status: "canceled", plan: null });
      }
    }
  } catch (e) {
    console.error("Stripe webhook handler:", e);
    return res.status(500).json({ error: "Webhook handler failed" });
  }

  res.json({ received: true });
};

