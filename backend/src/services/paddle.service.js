const axios = require("axios");
const pool = require("../config/db");

const GENERATE_PAY_LINK =
  "https://vendors.paddle.com/api/2.0/product/generate_pay_link";

async function getOrganizationForBilling(orgId) {
  const res = await pool.query(
    `SELECT o.id, o.name, o.email, o.stripe_customer_id, o.stripe_subscription_id,
            o.subscription_status,
            (SELECT u.email FROM users u
             WHERE u.organization_id = o.id AND u.role = 'admin'
             ORDER BY u.id ASC LIMIT 1) AS admin_email
     FROM organizations o WHERE o.id = $1`,
    [orgId]
  );
  if (res.rows.length === 0) {
    const err = new Error("Organizacija nije pronađena.");
    err.statusCode = 404;
    throw err;
  }
  return res.rows[0];
}

function getPaddleProductConfig() {
  const vendorId = process.env.PADDLE_VENDOR_ID;
  const vendorAuthCode = process.env.PADDLE_API_KEY;
  const productId = process.env.PADDLE_PRODUCT_ID;
  if (!vendorId || !vendorAuthCode || !productId) {
    const err = new Error(
      "Paddle nije podešen (PADDLE_VENDOR_ID, PADDLE_API_KEY, PADDLE_PRODUCT_ID)."
    );
    err.statusCode = 503;
    throw err;
  }
  return {
    vendor_id: String(vendorId),
    vendor_auth_code: vendorAuthCode,
    product_id: String(productId),
  };
}

function encodeForm(fields) {
  return new URLSearchParams(fields).toString();
}

async function postGeneratePayLink(fields) {
  const body = encodeForm(fields);
  const res = await axios.post(GENERATE_PAY_LINK, body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 25000,
    validateStatus: () => true,
  });

  const data = res.data;
  if (!data || data.success !== true) {
    const msg =
      (data && data.error && data.error.message) ||
      (typeof data === "string" ? data : null) ||
      "Paddle generate_pay_link nije uspeo.";
    const err = new Error(msg);
    err.statusCode = 502;
    throw err;
  }
  const url = data.response && data.response.url;
  if (!url) {
    const err = new Error("Paddle nije vratio URL.");
    err.statusCode = 502;
    throw err;
  }
  return url;
}

/**
 * Nova pretplata — Paddle Classic checkout.
 * Passthrough nosi organization_id za webhook.
 */
async function createCheckoutSession(orgId) {
  const base = getPaddleProductConfig();
  const org = await getOrganizationForBilling(orgId);
  const email =
    (org.email && String(org.email).trim()) ||
    (org.admin_email && String(org.admin_email).trim()) ||
    "";

  const passthrough = JSON.stringify({ organization_id: orgId });

  const url = await postGeneratePayLink({
    ...base,
    customer_email: email,
    passthrough,
  });

  return { url };
}

/**
 * Postojeća pretplata — link za izmenu kartice / plana (Classic generate_pay_link + subscription_id).
 */
async function createBillingPortalSession(orgId) {
  const base = getPaddleProductConfig();
  const org = await getOrganizationForBilling(orgId);
  if (!org.stripe_subscription_id) {
    const err = new Error(
      "Nema Paddle pretplate za ovaj salon. Prvo aktiviraj pretplatu."
    );
    err.statusCode = 400;
    throw err;
  }

  const url = await postGeneratePayLink({
    ...base,
    subscription_id: String(org.stripe_subscription_id),
  });

  return { url };
}

module.exports = {
  getOrganizationForBilling,
  createCheckoutSession,
  createBillingPortalSession,
};
