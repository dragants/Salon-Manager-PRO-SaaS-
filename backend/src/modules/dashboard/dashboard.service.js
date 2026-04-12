const pool = require("../../config/db");

async function getOrgTimeZone(orgId) {
  const r = await pool.query(
    `SELECT settings FROM organizations WHERE id = $1`,
    [orgId]
  );
  const tz = r.rows[0]?.settings?.timezone;
  if (tz && String(tz).trim()) {
    return String(tz).trim();
  }
  return process.env.APP_TIMEZONE || "Europe/Belgrade";
}

const todaySql = `SELECT COUNT(*)::int AS c FROM appointments a
       WHERE a.organization_id = $1
         AND (timezone($2::text, a.date))::date =
             (timezone($2::text, now()))::date`;

const nextSql = `SELECT to_char(timezone($2::text, a.date), 'HH24:MI') AS t
       FROM appointments a
       WHERE a.organization_id = $1
         AND a.status = 'scheduled'
         AND a.date >= NOW()
       ORDER BY a.date ASC
       LIMIT 1`;

async function getSummary(orgId, isAdmin) {
  const tz = await getOrgTimeZone(orgId);

  if (!isAdmin) {
    const [todayAppt, nextAppt] = await Promise.all([
      pool.query(todaySql, [orgId, tz]),
      pool.query(nextSql, [orgId, tz]),
    ]);
    return {
      todayAppointments: todayAppt.rows[0]?.c ?? 0,
      nextAppointment: nextAppt.rows[0]?.t ?? null,
    };
  }

  const [todayAppt, revenue, clients, nextAppt] = await Promise.all([
    pool.query(todaySql, [orgId, tz]),
    pool.query(
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
    ),
    pool.query(
      `SELECT COUNT(*)::int AS c FROM clients WHERE organization_id = $1`,
      [orgId]
    ),
    pool.query(nextSql, [orgId, tz]),
  ]);

  return {
    todayAppointments: todayAppt.rows[0]?.c ?? 0,
    revenue: Number(revenue.rows[0]?.total ?? 0),
    clients: clients.rows[0]?.c ?? 0,
    nextAppointment: nextAppt.rows[0]?.t ?? null,
  };
}

module.exports = { getSummary, getOrgTimeZone };
