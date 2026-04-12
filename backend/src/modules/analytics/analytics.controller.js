const pool = require("../../config/db");
const { getOrgTimeZone } = require("../dashboard/dashboard.service");

function num(v) {
  return Number(v ?? 0);
}

/**
 * @param {number} orgId
 * @param {string} tz
 */
async function revenueToday(orgId, tz) {
  const r = await pool.query(
    `SELECT (
       (SELECT COALESCE(SUM(amount), 0) FROM payments
        WHERE organization_id = $1
          AND (timezone($2::text, date))::date =
              (timezone($2::text, now()))::date)
       +
       (SELECT COALESCE(SUM(s.price), 0) FROM appointments a
        INNER JOIN services s
          ON s.id = a.service_id AND s.organization_id = a.organization_id
        WHERE a.organization_id = $1
          AND a.status = 'completed'
          AND (timezone($2::text, a.date))::date =
              (timezone($2::text, now()))::date)
     )::numeric AS total`,
    [orgId, tz]
  );
  return num(r.rows[0]?.total);
}

/**
 * @param {number} orgId
 * @param {string} tz
 */
async function revenueMonth(orgId, tz) {
  const r = await pool.query(
    `SELECT (
       (SELECT COALESCE(SUM(amount), 0) FROM payments
        WHERE organization_id = $1
          AND to_char(timezone($2::text, date), 'YYYY-MM')
              = to_char(timezone($2::text, now()), 'YYYY-MM'))
       +
       (SELECT COALESCE(SUM(s.price), 0) FROM appointments a
        INNER JOIN services s
          ON s.id = a.service_id AND s.organization_id = a.organization_id
        WHERE a.organization_id = $1
          AND a.status = 'completed'
          AND to_char(timezone($2::text, a.date), 'YYYY-MM')
              = to_char(timezone($2::text, now()), 'YYYY-MM'))
     )::numeric AS total`,
    [orgId, tz]
  );
  return num(r.rows[0]?.total);
}

/**
 * @param {number} orgId
 * @param {string} tz
 */
async function appointmentsToday(orgId, tz) {
  const r = await pool.query(
    `SELECT COUNT(*)::int AS c FROM appointments
     WHERE organization_id = $1
       AND (timezone($2::text, date))::date =
           (timezone($2::text, now()))::date`,
    [orgId, tz]
  );
  return r.rows[0]?.c ?? 0;
}

/**
 * @param {number} orgId
 */
async function noShowPercent(orgId) {
  const r = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'no_show')::int AS ns
     FROM appointments
     WHERE organization_id = $1`,
    [orgId]
  );
  const total = r.rows[0]?.total ?? 0;
  const ns = r.rows[0]?.ns ?? 0;
  if (total === 0) {
    return 0;
  }
  return Math.round((ns / total) * 1000) / 10;
}

/**
 * Broj termina po danu (poslednjih `days` dana uključujući danas).
 * @param {number} orgId
 * @param {string} tz
 * @param {number} days
 */
async function appointmentCountByDay(orgId, tz, days) {
  const r = await pool.query(
    `SELECT to_char((timezone($2::text, a.date))::date, 'YYYY-MM-DD') AS day,
            COUNT(*)::int AS count
     FROM appointments a
     WHERE a.organization_id = $1
       AND (timezone($2::text, a.date))::date
           >= (timezone($2::text, now()))::date - ($3::int - 1) * INTERVAL '1 day'
     GROUP BY (timezone($2::text, a.date))::date
     ORDER BY (timezone($2::text, a.date))::date`,
    [orgId, tz, days]
  );
  return r.rows.map((row) => ({ day: row.day, count: row.count }));
}

/**
 * Prihod po danu (uplate + završeni termini), poslednjih `days` dana.
 * @param {number} orgId
 * @param {string} tz
 * @param {number} days
 */
async function revenueByDay(orgId, tz, days) {
  const r = await pool.query(
    `WITH days AS (
       SELECT generate_series(
         (timezone($2::text, now()))::date - ($3::int - 1) * INTERVAL '1 day',
         (timezone($2::text, now()))::date,
         INTERVAL '1 day'
       )::date AS d
     ),
     pay AS (
       SELECT (timezone($2::text, p.date))::date AS d, SUM(p.amount)::numeric AS amt
       FROM payments p
       WHERE p.organization_id = $1
       GROUP BY 1
     ),
     ap AS (
       SELECT (timezone($2::text, a.date))::date AS d, SUM(s.price)::numeric AS amt
       FROM appointments a
       INNER JOIN services s
         ON s.id = a.service_id AND s.organization_id = a.organization_id
       WHERE a.organization_id = $1 AND a.status = 'completed'
       GROUP BY 1
     )
     SELECT to_char(days.d, 'YYYY-MM-DD') AS day,
            COALESCE(pay.amt, 0) + COALESCE(ap.amt, 0) AS revenue
     FROM days
     LEFT JOIN pay ON pay.d = days.d
     LEFT JOIN ap ON ap.d = days.d`,
    [orgId, tz, days]
  );
  return r.rows.map((row) => ({
    day: row.day,
    revenue: num(row.revenue),
  }));
}

/**
 * @param {number} orgId
 */
async function topServices(orgId) {
  const r = await pool.query(
    `SELECT s.id,
            s.name,
            COUNT(a.id)::int AS booking_count,
            COALESCE(
              SUM(CASE WHEN a.status = 'completed' THEN s.price::numeric ELSE 0 END),
              0
            )::numeric AS revenue
     FROM services s
     LEFT JOIN appointments a
       ON a.service_id = s.id AND a.organization_id = s.organization_id
     WHERE s.organization_id = $1
     GROUP BY s.id, s.name
     ORDER BY revenue DESC NULLS LAST, booking_count DESC
     LIMIT 5`,
    [orgId]
  );
  return r.rows.map((x) => ({
    id: x.id,
    name: x.name,
    booking_count: x.booking_count,
    revenue: num(x.revenue),
  }));
}

/**
 * @param {number} orgId
 */
async function topServicesByVolume(orgId) {
  const r = await pool.query(
    `SELECT s.id,
            s.name,
            COUNT(a.id)::int AS booking_count
     FROM services s
     LEFT JOIN appointments a
       ON a.service_id = s.id AND a.organization_id = s.organization_id
     WHERE s.organization_id = $1
     GROUP BY s.id, s.name
     ORDER BY booking_count DESC
     LIMIT 5`,
    [orgId]
  );
  return r.rows.map((x) => ({
    id: x.id,
    name: x.name,
    booking_count: x.booking_count,
    revenue: 0,
  }));
}

/**
 * @param {number} orgId
 */
async function topClientsByVisits(orgId) {
  const r = await pool.query(
    `SELECT c.id,
            c.name,
            COUNT(a.id)::int AS visits
     FROM clients c
     INNER JOIN appointments a
       ON a.client_id = c.id AND a.organization_id = c.organization_id
     WHERE c.organization_id = $1
     GROUP BY c.id, c.name
     ORDER BY visits DESC
     LIMIT 5`,
    [orgId]
  );
  return r.rows.map((x) => ({
    id: x.id,
    name: x.name,
    visits: x.visits,
    revenue: 0,
  }));
}

/**
 * @param {number} orgId
 */
async function topClients(orgId) {
  const r = await pool.query(
    `SELECT c.id,
            c.name,
            COUNT(a.id)::int AS visits,
            COALESCE(
              SUM(CASE WHEN a.status = 'completed' THEN s.price::numeric ELSE 0 END),
              0
            )::numeric AS revenue
     FROM clients c
     INNER JOIN appointments a
       ON a.client_id = c.id AND a.organization_id = c.organization_id
     INNER JOIN services s
       ON s.id = a.service_id AND s.organization_id = a.organization_id
     WHERE c.organization_id = $1
     GROUP BY c.id, c.name
     ORDER BY revenue DESC NULLS LAST, visits DESC
     LIMIT 5`,
    [orgId]
  );
  return r.rows.map((x) => ({
    id: x.id,
    name: x.name,
    visits: x.visits,
    revenue: num(x.revenue),
  }));
}

function mergeSeries(apptByDay, revByDay) {
  const revMap = new Map(revByDay.map((x) => [x.day, x.revenue]));
  const apMap = new Map(apptByDay.map((x) => [x.day, x.count]));
  const days = new Set([...revMap.keys(), ...apMap.keys()]);
  const sorted = [...days].sort();
  return sorted.map((day) => ({
    day,
    appointments: apMap.get(day) ?? 0,
    revenue: revMap.get(day) ?? 0,
  }));
}

async function getAnalytics(req, res) {
  const orgId = req.user.orgId;
  const tz = await getOrgTimeZone(orgId);
  const isAdmin = req.user.role !== "worker";

  const [appt30, appt7, rev30, rev7, clientsTotal, apptTotal] =
    await Promise.all([
      appointmentCountByDay(orgId, tz, 30),
      appointmentCountByDay(orgId, tz, 7),
      isAdmin ? revenueByDay(orgId, tz, 30) : Promise.resolve([]),
      isAdmin ? revenueByDay(orgId, tz, 7) : Promise.resolve([]),
      pool.query(
        `SELECT COUNT(*)::int AS c FROM clients WHERE organization_id = $1`,
        [orgId]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS c FROM appointments WHERE organization_id = $1`,
        [orgId]
      ),
    ]);

  const series30 = mergeSeries(appt30, rev30);
  const series7 = mergeSeries(appt7, rev7);

  const [nsPct, rt, rm, at, topS, topC] = await Promise.all([
    noShowPercent(orgId),
    isAdmin ? revenueToday(orgId, tz) : Promise.resolve(null),
    isAdmin ? revenueMonth(orgId, tz) : Promise.resolve(null),
    appointmentsToday(orgId, tz),
    isAdmin ? topServices(orgId) : topServicesByVolume(orgId),
    isAdmin ? topClients(orgId) : topClientsByVisits(orgId),
  ]);

  const legacyChart = series30.map((x) => ({
    day: x.day,
    count: x.appointments,
  }));

  res.json({
    revenue_month: rm,
    revenue_today: rt,
    appointments_today: at,
    appointments_total: apptTotal.rows[0]?.c ?? 0,
    clients: clientsTotal.rows[0]?.c ?? 0,
    no_show_percent: nsPct,
    series7,
    series30,
    chart: legacyChart,
    revenue: rm,
    appointments: apptTotal.rows[0]?.c ?? 0,
    top_services: topS,
    top_clients: topC,
    _meta: { financials: isAdmin },
  });
}

module.exports = { getAnalytics };
