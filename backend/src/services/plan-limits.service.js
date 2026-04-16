const pool = require("../config/db");
const env = require("../config/env");

function clientCapForPlan(plan) {
  if (plan === "free") return env.FREE_TIER_MAX_CLIENTS;
  if (plan === "basic") return env.BASIC_TIER_MAX_CLIENTS;
  return env.PRO_TIER_MAX_CLIENTS;
}

function appointmentCapForPlan(plan) {
  if (plan === "free") return env.FREE_TIER_MAX_APPOINTMENTS_PER_MONTH;
  if (plan === "basic") return env.BASIC_TIER_MAX_APPOINTMENTS_PER_MONTH;
  return env.PRO_TIER_MAX_APPOINTMENTS_PER_MONTH;
}

/**
 * Efektivni plan za limite: bez aktivne pretplate uvek free.
 * @param {{ subscription_status?: string | null, billing_plan?: string | null } | undefined} row
 * @returns {'free'|'basic'|'pro'}
 */
function resolveEffectivePlan(row) {
  if (!row) return "free";
  const st = row.subscription_status;
  const paid = st === "active" || st === "trialing";
  if (!paid) return "free";
  const p = String(row.billing_plan || "basic").toLowerCase();
  if (p === "pro") return "pro";
  if (p === "basic") return "basic";
  return "basic";
}

async function fetchOrgPlanRow(orgId) {
  let r;
  try {
    r = await pool.query(
      `SELECT subscription_status, billing_plan FROM organizations WHERE id = $1`,
      [orgId]
    );
  } catch (e) {
    if (e.code === "42703") {
      r = await pool.query(
        `SELECT subscription_status FROM organizations WHERE id = $1`,
        [orgId]
      );
      if (r.rows[0]) {
        r.rows[0].billing_plan = "basic";
      }
    } else {
      throw e;
    }
  }
  return r.rows[0];
}

/**
 * @param {number} orgId
 * @returns {Promise<{
 *   enforced: boolean;
 *   plan: 'free'|'basic'|'pro';
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
      plan: "free",
      tier: "free",
      max_clients: null,
      current_clients: current,
      at_limit: false,
    };
  }

  const row = await fetchOrgPlanRow(orgId);
  const plan = resolveEffectivePlan(row);
  const max = clientCapForPlan(plan);

  return {
    enforced: true,
    plan,
    tier: plan === "free" ? "free" : "paid",
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
      s.plan === "free"
        ? "Dostignut je besplatni limit klijenata. Aktiviraj pretplatu da dodaš više."
        : s.plan === "basic"
          ? "Dostignut je limit klijenata na Basic planu. Nadogradi na Pro ili obriši neaktivne zapise."
          : "Dostignut je limit klijenata na Pro planu. Kontaktiraj podršku."
    );
    err.statusCode = 403;
    err.apiCode = "PLAN_CLIENT_LIMIT";
    err.details = {
      plan: s.plan,
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
      plan: "free",
      tier: "free",
      timezone: tz,
      max_appointments_month: null,
      current_appointments_month: current,
      at_limit: false,
    };
  }

  const row = await fetchOrgPlanRow(orgId);
  const plan = resolveEffectivePlan(row);
  const max = appointmentCapForPlan(plan);

  return {
    enforced: true,
    plan,
    tier: plan === "free" ? "free" : "paid",
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
      s.plan === "free"
        ? "Dostignut je besplatni mesečni limit termina. Aktiviraj pretplatu za više rezervacija."
        : s.plan === "basic"
          ? "Dostignut je mesečni limit termina na Basic planu. Nadogradi na Pro."
          : "Dostignut je mesečni limit termina na Pro planu. Kontaktiraj podršku."
    );
    err.statusCode = 403;
    err.apiCode = "PLAN_APPOINTMENT_MONTH_LIMIT";
    err.details = {
      plan: s.plan,
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
