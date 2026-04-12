const pool = require("../../config/db");
const service = require("./shifts.service");

function orgTzFromSettings(settings) {
  const z = settings?.timezone;
  if (z && typeof z === "string" && z.trim()) {
    return z.trim();
  }
  return process.env.APP_TIMEZONE || "Europe/Belgrade";
}

async function list(req, res) {
  const { day, timezone: qTz } = req.validatedQuery;
  let tz = qTz;
  if (!tz) {
    const r = await pool.query(
      `SELECT settings FROM organizations WHERE id = $1`,
      [req.user.orgId]
    );
    tz = orgTzFromSettings(r.rows[0]?.settings);
  }
  const rows = await service.listByDay(req.user.orgId, day, tz);
  res.json({ shifts: rows });
}

async function replace(req, res) {
  const { day, timezone: qTz } = req.validatedQuery;
  const { shifts } = req.body;
  let tz = qTz;
  if (!tz) {
    const r = await pool.query(
      `SELECT settings FROM organizations WHERE id = $1`,
      [req.user.orgId]
    );
    tz = orgTzFromSettings(r.rows[0]?.settings);
  }
  await service.replaceForDay(req.user.orgId, day, shifts, tz);
  const rows = await service.listByDay(req.user.orgId, day, tz);
  res.json({ ok: true, shifts: rows });
}

module.exports = { list, replace };
