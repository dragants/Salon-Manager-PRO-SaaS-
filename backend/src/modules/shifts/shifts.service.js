const pool = require("../../config/db");
const { minutesSinceMidnightInZone } = require("../../utils/instantInTimeZone");

function pgTimeToMinutes(t) {
  const parts = String(t ?? "00:00:00").split(":");
  const h = Number.parseInt(parts[0], 10);
  const m = Number.parseInt(parts[1] ?? "0", 10);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
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

function hhmmToPgTime(s) {
  const m = /^(\d{2}):(\d{2})$/.exec(String(s).trim());
  if (!m) {
    return null;
  }
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) {
    return null;
  }
  return `${m[1]}:${m[2]}:00`;
}

/**
 * @param {number} orgId
 * @param {string} day YYYY-MM-DD
 * @param {{ user_id: number, start: string, end: string }[]} shifts
 */
async function replaceForDay(orgId, day, shifts, timeZone) {
  assertValidTimeZone(timeZone);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userIds = [...new Set(shifts.map((s) => s.user_id))];
    if (userIds.length > 0) {
      const chk = await client.query(
        `SELECT id FROM users
         WHERE organization_id = $1 AND id = ANY($2::int[])`,
        [orgId, userIds]
      );
      if (chk.rows.length !== userIds.length) {
        const err = new Error("Jedan ili više radnika ne pripadaju ovom salonu.");
        err.statusCode = 400;
        throw err;
      }
    }

    await client.query(
      `DELETE FROM work_shifts WHERE organization_id = $1 AND shift_date = $2::date`,
      [orgId, day]
    );

    for (const s of shifts) {
      const st = hhmmToPgTime(s.start);
      const en = hhmmToPgTime(s.end);
      if (!st || !en) {
        const err = new Error("Neispravno vreme smene (očekuje se HH:MM).");
        err.statusCode = 400;
        throw err;
      }
      await client.query(
        `INSERT INTO work_shifts (organization_id, user_id, shift_date, start_time, end_time)
         VALUES ($1, $2, $3::date, $4::time, $5::time)`,
        [orgId, s.user_id, day, st, en]
      );
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function listByDay(orgId, day, timeZone) {
  assertValidTimeZone(timeZone);
  const r = await pool.query(
    `SELECT ws.id, ws.user_id, ws.shift_date,
            to_char(ws.start_time, 'HH24:MI') AS start,
            to_char(ws.end_time, 'HH24:MI') AS "end",
            u.display_name,
            u.email
     FROM work_shifts ws
     INNER JOIN users u
       ON u.id = ws.user_id AND u.organization_id = ws.organization_id
     WHERE ws.organization_id = $1 AND ws.shift_date = $2::date
     ORDER BY u.id, ws.start_time`,
    [orgId, day]
  );
  return r.rows;
}

/**
 * Javna rezervacija: početak + trajanje moraju stati u bar jednu smenu radnika tog dana.
 */
async function assertUserShiftCovers(
  orgId,
  userId,
  ymd,
  startIso,
  durationMinutes,
  timeZone
) {
  let r;
  try {
    r = await pool.query(
      `SELECT start_time, end_time FROM work_shifts
       WHERE organization_id = $1 AND user_id = $2 AND shift_date = $3::date
       ORDER BY start_time`,
      [orgId, userId, ymd]
    );
  } catch (e) {
    if (e.code === "42P01") {
      const err = new Error("Smene nisu dostupne u bazi.");
      err.statusCode = 503;
      throw err;
    }
    throw e;
  }
  if (r.rows.length === 0) {
    const err = new Error("Radnik nema smenu tog dana.");
    err.statusCode = 400;
    throw err;
  }
  const startMin = minutesSinceMidnightInZone(startIso, timeZone);
  const endMin = startMin + Math.max(1, Number(durationMinutes) || 60);
  for (const row of r.rows) {
    const a = pgTimeToMinutes(row.start_time);
    const b = pgTimeToMinutes(row.end_time);
    if (startMin >= a && endMin <= b) {
      return;
    }
  }
  const err = new Error("Izabrano vreme nije u smeni ovog radnika.");
  err.statusCode = 400;
  throw err;
}

module.exports = { replaceForDay, listByDay, assertUserShiftCovers };
