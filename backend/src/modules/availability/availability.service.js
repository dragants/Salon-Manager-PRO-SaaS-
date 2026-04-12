const pool = require("../../config/db");
const {
  minutesSinceMidnightInZone,
  isoFromYmdAndMinutesInZone,
  weekdayDayIdFromYmd,
} = require("../../utils/instantInTimeZone");
const {
  intervalsForDay,
  maxOrgCloseMinutes,
  rangeInsideOrgIntervals,
} = require("../../utils/workingHoursIntervals");

function orgTzFromRow(settings) {
  const z = settings?.timezone;
  if (z && typeof z === "string" && z.trim()) {
    return z.trim();
  }
  return process.env.APP_TIMEZONE || "Europe/Belgrade";
}

function assertValidTimeZone(zone) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: zone });
  } catch {
    const err = new Error("Invalid timezone");
    err.statusCode = 400;
    throw err;
  }
}

/** @param {string|Date} t PostgreSQL TIME string npr. "09:00:00" */
function timeToMinutes(t) {
  const s = String(t ?? "00:00:00");
  const parts = s.split(":");
  const h = Number.parseInt(parts[0], 10);
  const m = Number.parseInt(parts[1] ?? "0", 10);
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return 0;
  }
  return h * 60 + m;
}

function minutesToHHMM(total) {
  const h = Math.floor(total / 60) % 24;
  const m = Math.round(total % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function intervalOverlap(a0, a1, b0, b1) {
  return a0 < b1 && b0 < a1;
}

/**
 * @param {number|null|undefined} empId
 * @param {number} slotStart
 * @param {number} slotEnd
 * @param {{ staff_user_id: unknown, startMin: number, endMin: number }[]} blocks
 */
function slotBlockedForEmployee(empId, slotStart, slotEnd, blocks) {
  const e = empId == null ? null : Number(empId);
  for (const b of blocks) {
    const staff = b.staff_user_id;
    if (staff == null) {
      if (intervalOverlap(slotStart, slotEnd, b.startMin, b.endMin)) {
        return true;
      }
    } else if (Number(staff) === e) {
      if (intervalOverlap(slotStart, slotEnd, b.startMin, b.endMin)) {
        return true;
      }
    }
  }
  return false;
}

function computeSoon(startIso) {
  const t = new Date(startIso).getTime();
  const now = Date.now();
  if (t < now) {
    return false;
  }
  return t - now <= 120 * 60 * 1000;
}

/**
 * @param {object} params
 * @param {{ user_id: number, startMin: number, endMin: number, display_name: string|null, email: string }[]} params.shiftRows
 * @param {{ date: string, staff_user_id: unknown, duration: number }[]} params.appointmentRows
 * @param {number} params.serviceDurationMinutes
 * @param {string} params.ymd
 * @param {string} params.timeZone
 * @param {number|undefined} params.staffFilterUserId
 * @param {[number, number][]|undefined} params.orgIntervals — radno vreme salona; ako je kraće od smene, širimo slotove do zatvaranja (bez preklapanja van intervala).
 */
function generateSlotsFromShiftsAndAppointments(params) {
  const {
    shiftRows,
    appointmentRows,
    serviceDurationMinutes,
    ymd,
    timeZone,
    staffFilterUserId,
    orgIntervals = [],
  } = params;

  const duration = Math.max(5, Math.min(24 * 60, Number(serviceDurationMinutes) || 60));

  const blocks = appointmentRows.map((a) => ({
    staff_user_id: a.staff_user_id,
    startMin: minutesSinceMidnightInZone(a.date, timeZone),
    endMin:
      minutesSinceMidnightInZone(a.date, timeZone) +
      Math.max(1, Number(a.duration) || 60),
  }));

  const slots = [];
  const orgLast = maxOrgCloseMinutes(orgIntervals);

  for (const sh of shiftRows) {
    if (
      staffFilterUserId != null &&
      Number(sh.user_id) !== Number(staffFilterUserId)
    ) {
      continue;
    }
    const name =
      (sh.display_name && String(sh.display_name).trim()) ||
      String(sh.email || "").trim() ||
      `Korisnik #${sh.user_id}`;

    let endCap = sh.endMin;
    if (orgLast != null) {
      if (orgLast < endCap) {
        endCap = orgLast;
      } else if (orgLast > endCap) {
        endCap = orgLast;
      }
    }

    let cur = sh.startMin;
    while (cur + duration <= endCap) {
      if (
        !rangeInsideOrgIntervals(cur, cur + duration, orgIntervals)
      ) {
        cur += duration;
        continue;
      }
      if (
        !slotBlockedForEmployee(sh.user_id, cur, cur + duration, blocks)
      ) {
        const startIso = isoFromYmdAndMinutesInZone(ymd, cur, timeZone);
        slots.push({
          employee_id: sh.user_id,
          employee_name: name,
          start: minutesToHHMM(cur),
          end: minutesToHHMM(cur + duration),
          start_iso: startIso,
          soon: computeSoon(startIso),
        });
      }
      cur += duration;
    }
  }

  slots.sort(
    (a, b) =>
      new Date(a.start_iso).getTime() - new Date(b.start_iso).getTime() ||
      a.employee_id - b.employee_id
  );

  return slots;
}

async function getSlots(orgId, query) {
  const { day, service_id, staff_user_id } = query;

  const orgR = await pool.query(
    `SELECT settings, working_hours FROM organizations WHERE id = $1`,
    [orgId]
  );
  if (orgR.rows.length === 0) {
    const err = new Error("Organizacija nije pronađena.");
    err.statusCode = 404;
    throw err;
  }
  const orgRow = orgR.rows[0];
  const timeZone = orgTzFromRow(orgRow.settings);
  assertValidTimeZone(timeZone);

  const svcR = await pool.query(
    `SELECT COALESCE(NULLIF(duration, 0), 60)::int AS duration
     FROM services WHERE id = $1 AND organization_id = $2`,
    [service_id, orgId]
  );
  if (svcR.rows.length === 0) {
    const err = new Error("Usluga nije pronađena.");
    err.statusCode = 404;
    throw err;
  }
  const serviceDurationMinutes = svcR.rows[0].duration;

  const shR = await pool.query(
    `SELECT ws.user_id,
            ws.start_time,
            ws.end_time,
            u.display_name,
            u.email
     FROM work_shifts ws
     INNER JOIN users u
       ON u.id = ws.user_id AND u.organization_id = ws.organization_id
     WHERE ws.organization_id = $1 AND ws.shift_date = $2::date
     ORDER BY ws.user_id, ws.start_time`,
    [orgId, day]
  );

  const shiftRows = shR.rows.map((row) => ({
    user_id: row.user_id,
    startMin: timeToMinutes(row.start_time),
    endMin: timeToMinutes(row.end_time),
    display_name: row.display_name,
    email: row.email,
  }));

  const apR = await pool.query(
    `SELECT a.date, a.staff_user_id,
            COALESCE(NULLIF(s.duration, 0), 60)::int AS duration
     FROM appointments a
     INNER JOIN services s
       ON s.id = a.service_id AND s.organization_id = a.organization_id
     WHERE a.organization_id = $1
       AND a.status = 'scheduled'
       AND (timezone($2::text, a.date))::date = $3::date`,
    [orgId, timeZone, day]
  );

  const appointmentRows = apR.rows;

  const dayId = weekdayDayIdFromYmd(day, timeZone);
  const orgIntervals =
    dayId && typeof dayId === "string"
      ? intervalsForDay(orgRow.working_hours || {}, dayId)
      : [];

  const slots = generateSlotsFromShiftsAndAppointments({
    shiftRows,
    appointmentRows,
    serviceDurationMinutes,
    ymd: day,
    timeZone,
    staffFilterUserId: staff_user_id,
    orgIntervals,
  });

  return {
    slots,
    timezone: timeZone,
    /** Ako je true, ne mešati sa slotovima iz radnog vremena (moguće da nema slobodnih). */
    from_shifts: shiftRows.length > 0,
  };
}

module.exports = {
  getSlots,
  generateSlotsFromShiftsAndAppointments,
  timeToMinutes,
  minutesToHHMM,
};
