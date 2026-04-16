const crypto = require("crypto");
const { serialize } = require("php-serialize");
const pool = require("../config/db");

function verifyPaddleSignature(body, publicKeyPem) {
  const signature = body.p_signature;
  if (!signature || !publicKeyPem) {
    return false;
  }
  const { p_signature: _sig, ...rest } = body;
  const sorted = {};
  for (const k of Object.keys(rest).sort()) {
    const v = rest[k];
    sorted[k] = v == null ? null : String(v);
  }
  const serialized = serialize(sorted);
  try {
    const verifier = crypto.createVerify("RSA-SHA1");
    verifier.update(serialized);
    verifier.end();
    return verifier.verify(publicKeyPem, signature, "base64");
  } catch {
    return false;
  }
}

function parsePassthrough(raw) {
  if (raw == null || raw === "") {
    return null;
  }
  if (typeof raw === "object") {
    return raw;
  }
  try {
    return JSON.parse(String(raw));
  } catch {
    return null;
  }
}

function mapPaddleStatus(statusRaw) {
  const s = String(statusRaw || "").toLowerCase();
  if (s === "active") return "active";
  if (s === "trialing") return "trialing";
  if (s === "past_due") return "past_due";
  if (s === "paused") return "paused";
  if (s === "deleted" || s === "canceled" || s === "cancelled") {
    return "canceled";
  }
  return s || "inactive";
}

/** Paddle Classic: subscription_plan_id ili product_id uporedi sa PADDLE_PRO_PRODUCT_IDS (zarez). */
function inferBillingPlanFromPaddleEvent(event) {
  const ids = [];
  if (event.subscription_plan_id != null) {
    ids.push(String(event.subscription_plan_id).trim());
  }
  if (event.product_id != null) {
    ids.push(String(event.product_id).trim());
  }
  const proIds = (process.env.PADDLE_PRO_PRODUCT_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const id of ids) {
    if (id && proIds.includes(id)) {
      return "pro";
    }
  }
  return "basic";
}

async function resolveOrgId(event) {
  const fromPass = parsePassthrough(event.passthrough);
  if (fromPass && fromPass.organization_id != null) {
    const id = Number(fromPass.organization_id);
    if (!Number.isNaN(id)) {
      return id;
    }
  }

  const email = event.email && String(event.email).trim().toLowerCase();
  if (email) {
    const byOrg = await pool.query(
      `SELECT id FROM organizations
       WHERE lower(trim(coalesce(email,''))) = $1 LIMIT 1`,
      [email]
    );
    if (byOrg.rows[0]) {
      return byOrg.rows[0].id;
    }
    const byAdmin = await pool.query(
      `SELECT u.organization_id AS id FROM users u
       WHERE u.role = 'admin' AND lower(trim(u.email)) = $1
       LIMIT 1`,
      [email]
    );
    if (byAdmin.rows[0]) {
      return byAdmin.rows[0].id;
    }
  }

  return null;
}

async function applySubscriptionEvent(event) {
  const alert = event.alert_name;
  const subscriptionId =
    event.subscription_id != null ? String(event.subscription_id) : null;
  const userId = event.user_id != null ? String(event.user_id) : null;

  let orgId = await resolveOrgId(event);
  if (!orgId && subscriptionId) {
    const r = await pool.query(
      `SELECT id FROM organizations WHERE stripe_subscription_id = $1 LIMIT 1`,
      [subscriptionId]
    );
    if (r.rows[0]) {
      orgId = r.rows[0].id;
    }
  }
  if (!orgId) {
    console.warn("Paddle webhook: nema organization_id (passthrough/email).", {
      alert,
      subscriptionId,
    });
    return;
  }

  if (
    alert === "subscription_created" ||
    alert === "subscription_updated" ||
    alert === "subscription_payment_succeeded"
  ) {
    const st = mapPaddleStatus(event.status || "active");
    const paid = st === "active" || st === "trialing";
    const billingPlan = paid ? inferBillingPlanFromPaddleEvent(event) : "free";
    try {
      await pool.query(
        `UPDATE organizations
         SET stripe_customer_id = COALESCE($1::text, stripe_customer_id),
             stripe_subscription_id = COALESCE($2::text, stripe_subscription_id),
             subscription_status = $3,
             billing_plan = $4
         WHERE id = $5`,
        [userId, subscriptionId, st, billingPlan, orgId]
      );
    } catch (e) {
      if (e.code !== "42703") {
        throw e;
      }
      await pool.query(
        `UPDATE organizations
         SET stripe_customer_id = COALESCE($1::text, stripe_customer_id),
             stripe_subscription_id = COALESCE($2::text, stripe_subscription_id),
             subscription_status = $3
         WHERE id = $4`,
        [userId, subscriptionId, st, orgId]
      );
    }
    return;
  }

  if (
    alert === "subscription_cancelled" ||
    alert === "subscription_payment_failed"
  ) {
    const st =
      alert === "subscription_cancelled" ? "canceled" : mapPaddleStatus("past_due");
    try {
      await pool.query(
        `UPDATE organizations
         SET subscription_status = $1,
             billing_plan = 'free'
         WHERE id = $2`,
        [st, orgId]
      );
    } catch (e) {
      if (e.code !== "42703") {
        throw e;
      }
      await pool.query(
        `UPDATE organizations SET subscription_status = $1 WHERE id = $2`,
        [st, orgId]
      );
    }
    return;
  }
}

module.exports = async function paddleWebhook(req, res) {
  const publicKey = process.env.PADDLE_PUBLIC_KEY;
  const skipVerify = process.env.PADDLE_WEBHOOK_SKIP_VERIFY === "true";

  if (publicKey && !skipVerify) {
    const pem = publicKey.includes("BEGIN PUBLIC KEY")
      ? publicKey.replace(/\\n/g, "\n")
      : publicKey;
    if (!verifyPaddleSignature(req.body, pem)) {
      console.error("Paddle webhook: nevažeći p_signature.");
      return res.status(400).send("Invalid signature");
    }
  } else if (process.env.NODE_ENV === "production" && !skipVerify) {
    console.error("PADDLE_PUBLIC_KEY nije podešen (obavezno u produkciji).");
    return res.status(503).send("Webhook not configured");
  } else if (!publicKey) {
    console.warn(
      "Paddle webhook: PADDLE_PUBLIC_KEY nedostaje — potpis nije proveren (samo dev)."
    );
  }

  try {
    await applySubscriptionEvent(req.body);
  } catch (e) {
    console.error("Paddle webhook handler:", e);
    return res.status(500).json({ error: "Webhook handler failed" });
  }

  res.sendStatus(200);
};
