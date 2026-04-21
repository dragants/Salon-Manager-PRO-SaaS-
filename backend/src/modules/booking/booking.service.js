const pool = require("../../config/db");
const {
  isoFromYmdAndMinutesInZone,
  minutesSinceMidnightInZone,
  weekdayDayIdFromYmd,
  ymdInTimeZone,
} = require("../../utils/instantInTimeZone");
const { assertValidTimeZone, localHourMinute } = require("../../utils/timezone");
const { hasAppointmentStaffUserColumn } = require("../appointments/appointments.service");
const {
  assertNoStaffScheduleOverlap,
} = require("../appointments/appointmentOverlap.service");
const { sendBookingNotifications } = require("../appointments/appointments.notify");
const { intervalsForDay } = require("../../utils/workingHoursIntervals");
const {
  assertCanAddClient,
  assertCanCreateAppointment,
} = require("../../services/plan-limits.service");

const DAY_IDS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function normalizeBookingSlug(slug) {
  return String(slug || "")
    .trim()
    .toLowerCase();
}

function calendarRulesFromOrg(org) {
  const s = org.settings || {};
  const cr = s.calendar_rules || {};
  return {
    min_gap_minutes:
      typeof cr.min_gap_minutes === "number" && cr.min_gap_minutes > 0
        ? Math.min(cr.min_gap_minutes, 120)
        : 30,
    max_clients_per_hour:
      typeof cr.max_clients_per_hour === "number" &&
      cr.max_clients_per_hour > 0
        ? Math.min(cr.max_clients_per_hour, 20)
        : 4,
    allow_overlap: Boolean(cr.allow_overlap),
    buffer_between_minutes:
      typeof cr.buffer_between_minutes === "number" &&
      cr.buffer_between_minutes >= 0
        ? cr.buffer_between_minutes
        : 0,
  };
}

function orgTimeZone(org) {
  const z = org.settings?.timezone;
  if (z && typeof z === "string" && z.trim()) {
    return z.trim();
  }
  return process.env.APP_TIMEZONE || "Europe/Belgrade";
}

async function getOrgByBookingSlug(slug) {
  const key = normalizeBookingSlug(slug);
  if (!key) {
    return null;
  }

  async function fromSettingsJson() {
    const r = await pool.query(
      `SELECT id, name, phone, address, logo, working_hours, settings
       FROM organizations
       WHERE lower(trim(COALESCE(settings->>'booking_slug',''))) = $1
         AND btrim(COALESCE(settings->>'booking_slug','')) <> ''
       ORDER BY id ASC
       LIMIT 1`,
      [key]
    );
    return r.rows[0] || null;
  }

  try {
    const r = await pool.query(
      `SELECT id, name, phone, address, logo, working_hours, settings, booking_slug
       FROM organizations
       WHERE booking_slug IS NOT NULL
         AND btrim(booking_slug) <> ''
         AND lower(booking_slug) = $1
       ORDER BY id ASC
       LIMIT 1`,
      [key]
    );
    if (r.rows.length > 0) {
      return r.rows[0];
    }
    return fromSettingsJson();
  } catch (e) {
    if (e.code === "42703") {
      return fromSettingsJson();
    }
    throw e;
  }
}

async function listServices(orgId) {
  const r = await pool.query(
    `SELECT id, name, price, duration, COALESCE(buffer_minutes, 0)::int AS buffer_minutes
     FROM services
     WHERE organization_id = $1
     ORDER BY name ASC`,
    [orgId]
  );
  return r.rows;
}

async function getService(orgId, serviceId) {
  const r = await pool.query(
    `SELECT id, name, duration, COALESCE(buffer_minutes, 0)::int AS buffer_minutes
     FROM services
     WHERE id = $1 AND organization_id = $2`,
    [serviceId, orgId]
  );
  return r.rows[0] || null;
}

async function fetchDayAppointments(orgId, ymd, timeZone) {
  const r = await pool.query(
    `SELECT a.date, s.duration, COALESCE(s.buffer_minutes, 0)::int AS buffer_minutes
     FROM appointments a
     INNER JOIN services s ON s.id = a.service_id AND s.organization_id = a.organization_id
     WHERE a.organization_id = $1
       AND a.status = 'scheduled'
       AND (timezone($2::text, a.date))::date = $3::date`,
    [orgId, timeZone, ymd]
  );
  return r.rows;
}

function overlapCount(
  slotStartMin,
  blockMinutes,
  appointments,
  bufferBetween,
  timeZone,
  ymd
) {
  const slotEnd = slotStartMin + blockMinutes;
  let n = 0;
  for (const a of appointments) {
    if (ymdInTimeZone(a.date, timeZone) !== ymd) {
      continue;
    }
    const apptStart = minutesSinceMidnightInZone(a.date, timeZone);
    const apptBlock =
      Number(a.duration) +
      Number(a.buffer_minutes) +
      bufferBetween;
    const apptEnd = apptStart + apptBlock;
    if (slotStartMin < apptEnd && apptStart < slotEnd) {
      n += 1;
    }
  }
  return n;
}

async function workShiftsExistForDay(orgId, ymd) {
  try {
    const r = await pool.query(
      `SELECT 1 FROM work_shifts
       WHERE organization_id = $1 AND shift_date = $2::date
       LIMIT 1`,
      [orgId, ymd]
    );
    return r.rowCount > 0;
  } catch (e) {
    if (e.code === "42P01") {
      return false;
    }
    throw e;
  }
}

async function getAvailableSlots(orgId, serviceId, ymd, timeZone) {
  assertValidTimeZone(timeZone);
  const org = await pool.query(
    `SELECT id, working_hours, settings FROM organizations WHERE id = $1`,
    [orgId]
  );
  if (org.rows.length === 0) {
    const err = new Error("Organizacija nije pronađena.");
    err.statusCode = 404;
    throw err;
  }
  const orgRow = org.rows[0];
  const svc = await getService(orgId, serviceId);
  if (!svc) {
    const err = new Error("Usluga nije pronađena.");
    err.statusCode = 404;
    throw err;
  }

  if (await workShiftsExistForDay(orgId, ymd)) {
    const availability = require("../availability/availability.service");
    const data = await availability.getSlots(orgId, {
      day: ymd,
      service_id: serviceId,
    });
    const nowMs = Date.now();
    const slots = data.slots
      .filter((s) => new Date(s.start_iso).getTime() > nowMs - 2000)
      .map((s) => ({
        start: s.start_iso,
        label: `${formatSlotLabel(s.start_iso, timeZone)} · ${s.employee_name}`,
        employee_id: s.employee_id,
        employee_name: s.employee_name,
      }));
    return {
      slots,
      timezone: timeZone,
      min_gap_minutes: Number(svc.duration) || 60,
      from_shifts: true,
    };
  }

  const rules = calendarRulesFromOrg(orgRow);
  const wh = orgRow.working_hours || {};
  const dayId = weekdayDayIdFromYmd(ymd, timeZone);
  if (!dayId || !DAY_IDS.includes(dayId)) {
    return { slots: [], timezone: timeZone, day_id: dayId };
  }

  const intervals = intervalsForDay(wh, dayId);
  const step = rules.min_gap_minutes;
  const duration = Number(svc.duration) || 60;
  const svcBuf = Number(svc.buffer_minutes) || 0;
  const blockMinutes =
    duration + svcBuf + rules.buffer_between_minutes;

  const maxConcurrent = rules.allow_overlap
    ? Math.max(1, rules.max_clients_per_hour)
    : 1;

  const appointments = await fetchDayAppointments(orgId, ymd, timeZone);

  const todayYmd = ymdInTimeZone(new Date().toISOString(), timeZone);
  const hm = localHourMinute(timeZone);
  const nowMinutes =
    todayYmd === ymd && hm ? hm.hour * 60 + hm.minute : null;

  const slots = [];
  for (const [openMin, closeMin] of intervals) {
    for (let m = openMin; m + duration <= closeMin; m += step) {
      if (nowMinutes != null && m <= nowMinutes) {
        continue;
      }
      const occ = overlapCount(
        m,
        blockMinutes,
        appointments,
        rules.buffer_between_minutes,
        timeZone,
        ymd
      );
      if (occ >= maxConcurrent) {
        continue;
      }
      const iso = isoFromYmdAndMinutesInZone(ymd, m, timeZone);
      slots.push({ start: iso, label: formatSlotLabel(iso, timeZone) });
    }
  }

  return {
    slots,
    timezone: timeZone,
    min_gap_minutes: step,
    from_shifts: false,
  };
}

function formatSlotLabel(iso, timeZone) {
  return new Date(iso).toLocaleTimeString("sr-Latn-RS", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function findOrCreateClient(orgId, name, phone, email) {
  const n = String(name).trim();
  const p = phone != null ? String(phone).trim() : "";
  const em =
    email != null && String(email).trim()
      ? String(email).trim().toLowerCase()
      : null;
  if (!n) {
    const err = new Error("Ime je obavezno.");
    err.statusCode = 400;
    throw err;
  }
  if (!p) {
    const err = new Error("Telefon je obavezan za rezervaciju.");
    err.statusCode = 400;
    throw err;
  }

  const existing = await pool.query(
    `SELECT id FROM clients
     WHERE organization_id = $1 AND phone = $2
     LIMIT 1`,
    [orgId, p]
  );
  if (existing.rows.length > 0) {
    const id = existing.rows[0].id;
    if (em) {
      await pool.query(
        `UPDATE clients SET name = $1, email = $2 WHERE id = $3 AND organization_id = $4`,
        [n, em, id, orgId]
      );
    } else {
      await pool.query(
        `UPDATE clients SET name = $1 WHERE id = $2 AND organization_id = $3`,
        [n, id, orgId]
      );
    }
    return id;
  }

  await assertCanAddClient(orgId);

  try {
    const ins = await pool.query(
      `INSERT INTO clients (organization_id, name, phone, email)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [orgId, n, p, em]
    );
    return ins.rows[0].id;
  } catch (e) {
    if (e.code === "42703") {
      const ins = await pool.query(
        `INSERT INTO clients (organization_id, name, phone)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [orgId, n, p]
      );
      return ins.rows[0].id;
    }
    throw e;
  }
}

async function assertSlotStillFree(
  orgId,
  service,
  startIso,
  timeZone,
  bufferBetween
) {
  const ymd = ymdInTimeZone(startIso, timeZone);
  const m = minutesSinceMidnightInZone(startIso, timeZone);
  const duration = Number(service.duration) || 60;
  const svcBuf = Number(service.buffer_minutes) || 0;
  const blockMinutes = duration + svcBuf + bufferBetween;

  const org = await pool.query(
    `SELECT settings FROM organizations WHERE id = $1`,
    [orgId]
  );
  const rules = calendarRulesFromOrg({ settings: org.rows[0]?.settings });
  const maxConcurrent = rules.allow_overlap
    ? Math.max(1, rules.max_clients_per_hour)
    : 1;

  const appointments = await fetchDayAppointments(orgId, ymd, timeZone);
  const occ = overlapCount(
    m,
    blockMinutes,
    appointments,
    bufferBetween,
    timeZone,
    ymd
  );
  if (occ >= maxConcurrent) {
    const err = new Error("Termin je u međuvremenu zauzet. Izaberi drugo vreme.");
    err.statusCode = 409;
    throw err;
  }
}

async function bookAppointment({
  org,
  serviceId,
  startIso,
  name,
  phone,
  email,
  timeZone,
  staffUserId,
}) {
  assertValidTimeZone(timeZone);
  const orgId = org.id;
  const service = await getService(orgId, serviceId);
  if (!service) {
    const err = new Error("Usluga nije pronađena.");
    err.statusCode = 404;
    throw err;
  }

  const rules = calendarRulesFromOrg(org);
  const ymd = ymdInTimeZone(startIso, timeZone);
  const dayId = weekdayDayIdFromYmd(ymd, timeZone);
  if (!dayId) {
    const err = new Error("Neispravan datum.");
    err.statusCode = 400;
    throw err;
  }
  const m = minutesSinceMidnightInZone(startIso, timeZone);
  const duration = Number(service.duration) || 60;
  const step = rules.min_gap_minutes;
  const shiftDay = await workShiftsExistForDay(orgId, ymd);
  const hasStaffCol = await hasAppointmentStaffUserColumn();
  if (shiftDay && !hasStaffCol) {
    const err = new Error(
      "Rezervacija po smenama zahteva ažuriranu bazu (dodela radnika na terminima)."
    );
    err.statusCode = 503;
    throw err;
  }

  if (shiftDay) {
    const uid =
      staffUserId != null && staffUserId !== ""
        ? Number(staffUserId)
        : NaN;
    if (!Number.isFinite(uid) || uid <= 0) {
      const err = new Error(
        "Izaberi termin sa liste — svaki termin je vezan za radnika."
      );
      err.statusCode = 400;
      throw err;
    }
    const uchk = await pool.query(
      `SELECT 1 FROM users WHERE id = $1 AND organization_id = $2`,
      [uid, orgId]
    );
    if (uchk.rowCount === 0) {
      const err = new Error("Radnik nije pronađen.");
      err.statusCode = 400;
      throw err;
    }
    const shiftsService = require("../shifts/shifts.service");
    await shiftsService.assertUserShiftCovers(
      orgId,
      uid,
      ymd,
      startIso,
      duration,
      timeZone
    );
    const availability = require("../availability/availability.service");
    const allowed = await availability.getSlots(orgId, {
      day: ymd,
      service_id: serviceId,
      staff_user_id: uid,
    });
    const t0 = new Date(startIso).getTime();
    const ok = allowed.slots.some(
      (s) => Math.abs(new Date(s.start_iso).getTime() - t0) < 3000
    );
    if (!ok) {
      const err = new Error(
        "Ovaj termin više nije slobodan. Osveži listu i izaberi drugo vreme."
      );
      err.statusCode = 409;
      throw err;
    }
    await assertNoStaffScheduleOverlap({
      orgId,
      excludeAppointmentId: null,
      candidateStart: startIso,
      serviceId,
      staffUserId: uid,
    });
  } else {
    const intervals = intervalsForDay(org.working_hours || {}, dayId);
    let inHours = false;
    let stepOk = false;
    for (const [a, b] of intervals) {
      if (m >= a && m + duration <= b) {
        inHours = true;
        if ((m - a) % step === 0) {
          stepOk = true;
        }
        break;
      }
    }
    if (!inHours) {
      const err = new Error("Izabrano vreme nije u radnom vremenu salona.");
      err.statusCode = 400;
      throw err;
    }
    if (!stepOk) {
      const err = new Error("Vreme mora odgovarati dostupnim terminima.");
      err.statusCode = 400;
      throw err;
    }

    await assertSlotStillFree(
      orgId,
      service,
      startIso,
      timeZone,
      rules.buffer_between_minutes
    );
  }

  const clientId = await findOrCreateClient(orgId, name, phone, email);

  await assertCanCreateAppointment(orgId);

  const staffParam =
    shiftDay && staffUserId != null && staffUserId !== ""
      ? Number(staffUserId)
      : null;
  let apptRes;
  if (hasStaffCol) {
    apptRes = await pool.query(
      `INSERT INTO appointments (client_id, service_id, date, organization_id, status, staff_user_id)
       VALUES ($1, $2, $3::timestamptz, $4, 'scheduled', $5)
       RETURNING id, client_id, service_id, date`,
      [clientId, serviceId, startIso, orgId, staffParam]
    );
  } else {
    apptRes = await pool.query(
      `INSERT INTO appointments (client_id, service_id, date, organization_id, status)
       VALUES ($1, $2, $3::timestamptz, $4, 'scheduled')
       RETURNING id, client_id, service_id, date`,
      [clientId, serviceId, startIso, orgId]
    );
  }

  const appointment = apptRes.rows[0];

  const s = org.settings || {};
  const bn = s.booking_notifications || {};
  const sendSms = bn.public_booking_sms !== false;
  const sendEmail = bn.public_booking_email === true;
  const sendWhatsApp = bn.public_booking_whatsapp === true;

  let notify = { sms: "skipped", whatsapp: "skipped", email: "skipped" };
  try {
    notify = await sendBookingNotifications(orgId, appointment, {
      sendSms,
      sendWhatsApp,
      sendEmail,
    });
  } catch (e) {
    console.error("Public booking notify", e);
  }

  return {
    ok: true,
    appointment_id: appointment.id,
    notify,
  };
}

function publicSalonPayload(org) {
  const tz = orgTimeZone(org);
  const bn = org.settings?.booking_notifications || {};
  const s = org.settings || {};
  const theme =
    (typeof s.theme_color === "string" && s.theme_color.trim()) ||
    (typeof s.primary_color === "string" && s.primary_color.trim()) ||
    null;
  return {
    salon: {
      name: org.name,
      phone: org.phone ?? null,
      address: org.address ?? null,
      logo: org.logo ?? null,
      timezone: tz,
      theme_color: theme,
    },
    booking_notify: {
      public_booking_sms: bn.public_booking_sms !== false,
      public_booking_email: bn.public_booking_email === true,
      public_booking_whatsapp: bn.public_booking_whatsapp === true,
    },
    services: [],
  };
}

module.exports = {
  normalizeBookingSlug,
  getOrgByBookingSlug,
  listServices,
  getAvailableSlots,
  bookAppointment,
  publicSalonPayload,
  orgTimeZone,
};
