const pool = require("../config/db");
const env = require("../config/env");

async function getOrganizationSubscriptionTier(orgId) {
  const r = await pool.query(
    `SELECT subscription_status FROM organizations WHERE id = $1`,
    [orgId]
  );
  const st = r.rows[0]?.subscription_status;
  const paid = st === "active" || st === "trialing";
  return paid ? "paid" : "free";
}

/**
 * @param {number} orgId
 * @returns {Promise<{
 *   enforced: boolean;
 *   tier: 'free' | 'paid';
 *   max_clients: number | null;
 *   current_clients: number;
 *   at_limit: boolean;
 * }>}
 */
async function getClientLimitState(orgId) {
  const countR = await pool.query(
    `SELECT COUNT(*)::int AS n FROM clients WHERE organization_id = $1`,
    [orgId]
  );
  const current = countR.rows[0]?.n ?? 0;

  if (!env.PLAN_LIMITS_ENFORCED) {
    return {
      enforced: false,
      tier: "free",
      max_clients: null,
      current_clients: current,
      at_limit: false,
    };
  }

  const tier = await getOrganizationSubscriptionTier(orgId);
  const max =
    tier === "paid"
      ? env.PAID_TIER_MAX_CLIENTS
      : env.FREE_TIER_MAX_CLIENTS;

  return {
    enforced: true,
    tier,
    max_clients: max,
    current_clients: current,
    at_limit: current >= max,
  };
}

async function assertCanAddClient(orgId) {
  const s = await getClientLimitState(orgId);
  if (!s.enforced) {
    return;
  }
  if (s.current_clients >= s.max_clients) {
    const err = new Error(
      s.tier === "paid"
        ? "Dostignut je limit klijenata na tvom planu. Obrisi neaktivne zapise ili kontaktiraj podršku."
        : "Dostignut je besplatni limit klijenata. Aktiviraj pretplatu da dodaš više."
    );
    err.statusCode = 403;
    err.apiCode = "PLAN_CLIENT_LIMIT";
    err.details = {
      tier: s.tier,
      max_clients: s.max_clients,
      current_clients: s.current_clients,
    };
    throw err;
  }
}

async function getOrganizationTimeZone(orgId) {
  const r = await pool.query(
    `SELECT settings FROM organizations WHERE id = $1`,
    [orgId]
  );
  const s = r.rows[0]?.settings || {};
  const tz =
    typeof s.timezone === "string" && s.timezone.trim()
      ? s.timezone.trim()
      : env.APP_TIMEZONE;
  return tz;
}

async function countAppointmentsCurrentMonthInZone(orgId, timeZone) {
  const r = await pool.query(
    `SELECT COUNT(*)::int AS n
     FROM appointments a
     WHERE a.organization_id = $1
       AND (timezone($2::text, a.date))::date >= date_trunc('month', timezone($2::text, now()))::date
       AND (timezone($2::text, a.date))::date < (date_trunc('month', timezone($2::text, now())) + interval '1 month')::date`,
    [orgId, timeZone]
  );
  return r.rows[0]?.n ?? 0;
}

/**
 * @param {number} orgId
 */
async function getAppointmentLimitState(orgId) {
  const tz = await getOrganizationTimeZone(orgId);
  const current = await countAppointmentsCurrentMonthInZone(orgId, tz);

  if (!env.PLAN_LIMITS_ENFORCED) {
    return {
      enforced: false,
      tier: "free",
      timezone: tz,
      max_appointments_month: null,
      current_appointments_month: current,
      at_limit: false,
    };
  }

  const tier = await getOrganizationSubscriptionTier(orgId);
  const max =
    tier === "paid"
      ? env.PAID_TIER_MAX_APPOINTMENTS_PER_MONTH
      : env.FREE_TIER_MAX_APPOINTMENTS_PER_MONTH;

  return {
    enforced: true,
    tier,
    timezone: tz,
    max_appointments_month: max,
    current_appointments_month: current,
    at_limit: current >= max,
  };
}

async function assertCanCreateAppointment(orgId) {
  const s = await getAppointmentLimitState(orgId);
  if (!s.enforced) {
    return;
  }
  if (s.current_appointments_month >= s.max_appointments_month) {
    const err = new Error(
      s.tier === "paid"
        ? "Dostignut je mesečni limit termina na tvom planu. Kontaktiraj podršku."
        : "Dostignut je besplatni mesečni limit termina. Aktiviraj pretplatu za više rezervacija."
    );
    err.statusCode = 403;
    err.apiCode = "PLAN_APPOINTMENT_MONTH_LIMIT";
    err.details = {
      tier: s.tier,
      max_appointments_month: s.max_appointments_month,
      current_appointments_month: s.current_appointments_month,
    };
    throw err;
  }
}

module.exports = {
  getClientLimitState,
  assertCanAddClient,
  getAppointmentLimitState,
  assertCanCreateAppointment,
};
