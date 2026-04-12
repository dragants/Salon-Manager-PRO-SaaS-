const pool = require("../../config/db");

/**
 * Ista logika kao frontend `hasOverlapWithOthers`: samo `scheduled`, isti „bucket“ radnika
 * (uključujući NULL), preklapanje po trajanju usluge (bez buffer polja).
 *
 * @param {object} opts
 * @param {number} opts.orgId
 * @param {number|null} opts.excludeAppointmentId
 * @param {string|Date} opts.candidateStart
 * @param {number} opts.serviceId
 * @param {number|null|undefined} opts.staffUserId
 */
async function assertNoStaffScheduleOverlap(opts) {
  const {
    orgId,
    excludeAppointmentId,
    candidateStart,
    serviceId,
    staffUserId,
  } = opts;

  const { hasAppointmentStaffUserColumn } = require("./appointments.service");
  const hasStaff = await hasAppointmentStaffUserColumn();
  const staffCheckDisabled = !hasStaff;
  const staffParam = hasStaff ? (staffUserId ?? null) : null;

  const start =
    typeof candidateStart === "string"
      ? candidateStart
      : candidateStart.toISOString();

  const durRow = await pool.query(
    `SELECT COALESCE(NULLIF(duration, 0), 60)::int AS duration
     FROM services
     WHERE id = $1 AND organization_id = $2`,
    [serviceId, orgId]
  );
  if (durRow.rows.length === 0) {
    const err = new Error("Usluga nije pronađena.");
    err.statusCode = 404;
    throw err;
  }
  const dur = Math.max(1, Number(durRow.rows[0].duration) || 60);

  const conflict = await pool.query(
    `SELECT a.id
     FROM appointments a
     INNER JOIN services s       ON s.id = a.service_id AND s.organization_id = a.organization_id
     WHERE a.organization_id = $1
       AND a.status = 'scheduled'
       AND ($2::int IS NULL OR a.id <> $2)
       AND ($3::boolean OR a.staff_user_id IS NOT DISTINCT FROM $4)
       AND a.date < ($5::timestamptz + ($6::int * interval '1 minute'))
       AND (a.date + (COALESCE(NULLIF(s.duration, 0), 60) * interval '1 minute')) > $5::timestamptz
     LIMIT 1`,
    [
      orgId,
      excludeAppointmentId,
      staffCheckDisabled,
      staffParam,
      start,
      dur,
    ]
  );

  if (conflict.rows.length > 0) {
    const err = new Error(
      "Ovaj termin se preklapa sa drugim zakazanim terminom za istog radnika."
    );
    err.statusCode = 409;
    throw err;
  }
}

module.exports = { assertNoStaffScheduleOverlap };
