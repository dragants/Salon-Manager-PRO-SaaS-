const webpush = require("web-push");
const pool = require("../config/db");

function vapidConfigured() {
  const pub = process.env.VAPID_PUBLIC_KEY && String(process.env.VAPID_PUBLIC_KEY).trim();
  const priv =
    process.env.VAPID_PRIVATE_KEY && String(process.env.VAPID_PRIVATE_KEY).trim();
  const subj =
    process.env.VAPID_SUBJECT && String(process.env.VAPID_SUBJECT).trim();
  return Boolean(pub && priv && subj);
}

function ensureWebPush() {
  if (!vapidConfigured()) {
    return false;
  }
  try {
    webpush.setVapidDetails(
      String(process.env.VAPID_SUBJECT).trim(),
      String(process.env.VAPID_PUBLIC_KEY).trim(),
      String(process.env.VAPID_PRIVATE_KEY).trim()
    );
    return true;
  } catch (e) {
    console.error("web-push VAPID init failed", e);
    return false;
  }
}

function rowToSubscription(row) {
  return {
    endpoint: row.endpoint,
    keys: {
      p256dh: row.p256dh,
      auth: row.auth,
    },
  };
}

async function saveSubscription(userId, orgId, body, userAgent) {
  const endpoint = body.endpoint && String(body.endpoint).trim();
  const keys = body.keys || {};
  const p256dh = keys.p256dh && String(keys.p256dh).trim();
  const auth = keys.auth && String(keys.auth).trim();
  if (!endpoint || !p256dh || !auth) {
    const err = new Error("Neispravna push pretplata.");
    err.statusCode = 400;
    throw err;
  }
  await pool.query(
    `INSERT INTO push_subscriptions (user_id, organization_id, endpoint, p256dh, auth, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, endpoint) DO UPDATE SET
       p256dh = EXCLUDED.p256dh,
       auth = EXCLUDED.auth,
       user_agent = EXCLUDED.user_agent`,
    [userId, orgId, endpoint, p256dh, auth, userAgent || null]
  );
  return { ok: true };
}

async function removeSubscription(userId, endpoint) {
  if (endpoint && String(endpoint).trim()) {
    await pool.query(
      `DELETE FROM push_subscriptions
       WHERE user_id = $1 AND endpoint = $2`,
      [userId, String(endpoint).trim()]
    );
  } else {
    await pool.query(`DELETE FROM push_subscriptions WHERE user_id = $1`, [
      userId,
    ]);
  }
  return { ok: true };
}

async function removeByEndpoint(endpoint) {
  await pool.query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [
    endpoint,
  ]);
}

async function sendToSubscriptionRow(row, payload) {
  if (!ensureWebPush()) {
    return { ok: false, reason: "vapid_not_configured" };
  }
  const sub = rowToSubscription(row);
  const body = JSON.stringify(payload);
  try {
    await webpush.sendNotification(sub, body, {
      TTL: 60 * 60,
      urgency: "normal",
    });
    return { ok: true };
  } catch (e) {
    const status = e.statusCode;
    if (status === 404 || status === 410) {
      await removeByEndpoint(row.endpoint);
    }
    throw e;
  }
}

/**
 * @param {number} userId
 * @param {{ title: string, body: string, url?: string }} payload
 */
async function sendToUser(userId, payload) {
  if (!ensureWebPush()) {
    return { sent: 0, skipped: "vapid" };
  }
  const r = await pool.query(
    `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`,
    [userId]
  );
  let sent = 0;
  for (const row of r.rows) {
    try {
      await sendToSubscriptionRow(row, payload);
      sent += 1;
    } catch (e) {
      console.error("Push send failed", e.message || e);
    }
  }
  return { sent };
}

/**
 * Svi aktivni push pretplatnici u organizaciji.
 * @param {number} orgId
 * @param {{ title: string, body: string, url?: string }} payload
 */
async function sendToOrganization(orgId, payload) {
  if (!ensureWebPush()) {
    return { sent: 0, skipped: "vapid" };
  }
  const r = await pool.query(
    `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE organization_id = $1`,
    [orgId]
  );
  let sent = 0;
  for (const row of r.rows) {
    try {
      await sendToSubscriptionRow(row, payload);
      sent += 1;
    } catch (e) {
      console.error("Push org send failed", e.message || e);
    }
  }
  return { sent };
}

/**
 * Samo izabrani korisnici u salonu (npr. dodeljeni radnik ili administratori).
 * @param {number} orgId
 * @param {number[]} userIds
 */
async function sendToUsersInOrganization(orgId, userIds, payload) {
  if (!userIds || userIds.length === 0) {
    return { sent: 0, skipped: "no_targets" };
  }
  if (!ensureWebPush()) {
    return { sent: 0, skipped: "vapid" };
  }
  const unique = [...new Set(userIds.map((n) => Number(n)).filter(Number.isFinite))];
  if (unique.length === 0) {
    return { sent: 0, skipped: "no_targets" };
  }
  const r = await pool.query(
    `SELECT s.endpoint, s.p256dh, s.auth
     FROM push_subscriptions s
     INNER JOIN users u ON u.id = s.user_id AND u.organization_id = s.organization_id
     WHERE s.organization_id = $1
       AND s.user_id = ANY($2::int[])`,
    [orgId, unique]
  );
  let sent = 0;
  for (const row of r.rows) {
    try {
      await sendToSubscriptionRow(row, payload);
      sent += 1;
    } catch (e) {
      console.error("Push targeted send failed", e.message || e);
    }
  }
  return { sent };
}

async function getAdminUserIds(orgId) {
  const r = await pool.query(
    `SELECT id FROM users WHERE organization_id = $1 AND role = 'admin'`,
    [orgId]
  );
  return r.rows.map((row) => row.id);
}

/**
 * Nova javna rezervacija:
 * - ako je termin vezan za radnika (staff_user_id) → push samo tom korisniku;
 * - inače → push svim administratorima salona koji imaju pretplatu.
 * Opciono: PUSH_NOTIFY_ADMINS_TOO=true uz dodeljenog radnika (i radnik i admini).
 */
async function notifyOrganizationNewPublicBooking(
  orgId,
  { clientName, serviceName, whenLabel, staffUserId }
) {
  if (process.env.PUSH_NOTIFY_NEW_BOOKING !== "true") {
    return { sent: 0, skipped: "disabled" };
  }
  const title = "Nova online rezervacija";
  const body = `${clientName} · ${serviceName} · ${whenLabel}`;
  const pushPayload = {
    title,
    body,
    url: "/calendar",
  };

  const adminsToo = process.env.PUSH_NOTIFY_ADMINS_TOO === "true";
  const rawStaff =
    staffUserId != null && staffUserId !== ""
      ? Number(staffUserId)
      : null;
  const staffId =
    rawStaff != null && Number.isFinite(rawStaff) && rawStaff > 0
      ? rawStaff
      : null;

  /** @type {number[]} */
  let targets = [];

  if (staffId != null) {
    const ok = await pool.query(
      `SELECT 1 FROM users WHERE id = $1 AND organization_id = $2`,
      [staffId, orgId]
    );
    if (ok.rowCount > 0) {
      targets.push(staffId);
    }
  }

  if (adminsToo || targets.length === 0) {
    const admins = await getAdminUserIds(orgId);
    targets = [...targets, ...admins];
  }

  targets = [...new Set(targets)];
  return sendToUsersInOrganization(orgId, targets, pushPayload);
}

module.exports = {
  vapidConfigured,
  getPublicKey: () =>
    vapidConfigured()
      ? String(process.env.VAPID_PUBLIC_KEY).trim()
      : null,
  saveSubscription,
  removeSubscription,
  sendToUser,
  sendToOrganization,
  sendToUsersInOrganization,
  notifyOrganizationNewPublicBooking,
};
