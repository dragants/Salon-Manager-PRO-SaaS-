const pool = require("../../config/db");
const { assertCanCreateAppointment } = require("../../services/plan-limits.service");
const {
  assertNoStaffScheduleOverlap,
} = require("./appointmentOverlap.service");

/** @type {boolean | undefined} */
let appointmentStaffUserIdColumnCache;

async function hasAppointmentStaffUserColumn() {
  if (appointmentStaffUserIdColumnCache === true) {
    return true;
  }
  const r = await pool.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = 'appointments'
         AND column_name = 'staff_user_id'
     ) AS ok`
  );
  const ok = Boolean(r.rows[0]?.ok);
  if (ok) {
    appointmentStaffUserIdColumnCache = true;
  }
  return ok;
}

/** @type {boolean | undefined} */
let loyaltyAppointmentColumnsCache;

async function hasLoyaltyAppointmentColumns() {
  if (loyaltyAppointmentColumnsCache === true) {
    return true;
  }
  const r = await pool.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = 'appointments'
         AND column_name = 'redeems_loyalty'
     ) AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = 'appointments'
         AND column_name = 'loyalty_program_id'
     ) AS ok`
  );
  const ok = Boolean(r.rows[0]?.ok);
  if (ok) {
    loyaltyAppointmentColumnsCache = true;
  }
  return ok;
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

async function assertClientInOrg(clientId, orgId) {
  const r = await pool.query(
    "SELECT 1 FROM clients WHERE id = $1 AND organization_id = $2",
    [clientId, orgId]
  );
  if (r.rowCount === 0) {
    const err = new Error("Client not found");
    err.statusCode = 404;
    throw err;
  }
}

async function assertServiceInOrg(serviceId, orgId) {
  const r = await pool.query(
    "SELECT 1 FROM services WHERE id = $1 AND organization_id = $2",
    [serviceId, orgId]
  );
  if (r.rowCount === 0) {
    const err = new Error("Service not found");
    err.statusCode = 404;
    throw err;
  }
}

/**
 * @param {number|null|undefined} staffUserId
 * @param {number} serviceId
 */
async function assertStaffUserInOrg(orgId, staffUserId, serviceId) {
  if (staffUserId == null) {
    return;
  }
  const r = await pool.query(
    `SELECT id, worker_profile FROM users
     WHERE id = $1 AND organization_id = $2`,
    [staffUserId, orgId]
  );
  if (r.rows.length === 0) {
    const err = new Error("Radnik nije u ovom salonu.");
    err.statusCode = 400;
    throw err;
  }
  const profile = r.rows[0].worker_profile;
  const ids =
    profile &&
    typeof profile === "object" &&
    Array.isArray(profile.service_ids) &&
    profile.service_ids.length > 0
      ? profile.service_ids.map(Number).filter(Number.isFinite)
      : null;
  if (ids && !ids.includes(Number(serviceId))) {
    const err = new Error("Izabrani radnik nema ovu uslugu u svom profilu.");
    err.statusCode = 400;
    throw err;
  }
}

async function assertAppointmentInOrg(appointmentId, orgId) {
  const r = await pool.query(
    "SELECT 1 FROM appointments WHERE id = $1 AND organization_id = $2",
    [appointmentId, orgId]
  );
  if (r.rowCount === 0) {
    const err = new Error("Not found");
    err.statusCode = 404;
    throw err;
  }
}

const listSelectWithStaff = `
  SELECT a.*,
         c.name AS client_name,
         c.phone AS client_phone,
         s.name AS service_name,
         s.duration AS service_duration,
         s.price AS service_price,
         u.email AS staff_email,
         u.display_name AS staff_display_name
  FROM appointments a
  INNER JOIN clients c ON c.id = a.client_id AND c.organization_id = a.organization_id
  INNER JOIN services s ON s.id = a.service_id AND s.organization_id = a.organization_id
  LEFT JOIN users u ON u.id = a.staff_user_id AND u.organization_id = a.organization_id
`;

const listSelectWithoutStaff = `
  SELECT a.*,
         c.name AS client_name,
         c.phone AS client_phone,
         s.name AS service_name,
         s.duration AS service_duration,
         s.price AS service_price,
         NULL::text AS staff_email,
         NULL::text AS staff_display_name
  FROM appointments a
  INNER JOIN clients c ON c.id = a.client_id AND c.organization_id = a.organization_id
  INNER JOIN services s ON s.id = a.service_id AND s.organization_id = a.organization_id
`;

async function listSelectFragment() {
  return (await hasAppointmentStaffUserColumn())
    ? listSelectWithStaff
    : listSelectWithoutStaff;
}

async function getAll(orgId, onlyStaffUserId = null) {
  const listSelect = await listSelectFragment();
  const extra =
    onlyStaffUserId != null
      ? ` AND a.staff_user_id = $2`
      : ``;
  const res = await pool.query(
    `${listSelect}
     WHERE a.organization_id = $1${extra}
     ORDER BY a.date ASC`,
    onlyStaffUserId != null ? [orgId, Number(onlyStaffUserId)] : [orgId]
  );
  return res.rows;
}

async function getByDay(orgId, day, timeZone, onlyStaffUserId = null) {
  assertValidTimeZone(timeZone);
  const listSelect = await listSelectFragment();
  const extra =
    onlyStaffUserId != null
      ? ` AND a.staff_user_id = $4`
      : ``;
  const res = await pool.query(
    `${listSelect}
     WHERE a.organization_id = $1
       AND to_char(timezone($3::text, a.date), 'YYYY-MM-DD') = $2
       ${extra}
     ORDER BY a.date ASC`,
    onlyStaffUserId != null
      ? [orgId, day, timeZone, Number(onlyStaffUserId)]
      : [orgId, day, timeZone]
  );
  return res.rows;
}

async function getByDateRange(orgId, from, to, timeZone, onlyStaffUserId = null) {
  assertValidTimeZone(timeZone);
  const listSelect = await listSelectFragment();
  const extra =
    onlyStaffUserId != null
      ? ` AND a.staff_user_id = $5`
      : ``;
  const res = await pool.query(
    `${listSelect}
     WHERE a.organization_id = $1
       AND (timezone($4::text, a.date))::date >= $2::date
       AND (timezone($4::text, a.date))::date <= $3::date
       ${extra}
     ORDER BY a.date ASC`,
    onlyStaffUserId != null
      ? [orgId, from, to, timeZone, Number(onlyStaffUserId)]
      : [orgId, from, to, timeZone]
  );
  return res.rows;
}

async function getById(id, orgId) {
  const listSelect = await listSelectFragment();
  const res = await pool.query(
    `${listSelect}
     WHERE a.id = $1 AND a.organization_id = $2`,
    [id, orgId]
  );
  if (res.rows.length === 0) {
    const err = new Error("Not found");
    err.statusCode = 404;
    throw err;
  }
  return res.rows[0];
}

async function create(data, orgId) {
  const {
    client_id,
    service_id,
    date,
    status,
    staff_user_id,
    redeems_loyalty,
    loyalty_program_id,
  } = data;

  await assertCanCreateAppointment(orgId);

  await assertClientInOrg(client_id, orgId);
  await assertServiceInOrg(service_id, orgId);

  const hasStaffCol = await hasAppointmentStaffUserColumn();
  const hasLoyCol = await hasLoyaltyAppointmentColumns();
  if (!hasStaffCol && staff_user_id != null) {
    const err = new Error(
      "Dodela radnika zahteva migraciju baze (006_appointments_staff_user)."
    );
    err.statusCode = 400;
    throw err;
  }
  await assertStaffUserInOrg(orgId, staff_user_id, service_id);

  const redeem = hasLoyCol && redeems_loyalty === true;
  const loyaltyPid = redeem ? loyalty_program_id : null;
  if (redeem) {
    if (!loyaltyPid) {
      const err = new Error(
        "Za iskorišćenje nagrade izaberi loyalty program (loyalty_program_id)."
      );
      err.statusCode = 400;
      throw err;
    }
    const loyaltyService = require("../loyalty/loyalty.service");
    await loyaltyService.assertRedeemAllowed(
      orgId,
      client_id,
      loyaltyPid,
      service_id
    );
  }

  const nextStatus = status ?? "scheduled";
  if (nextStatus === "scheduled") {
    await assertNoStaffScheduleOverlap({
      orgId,
      excludeAppointmentId: null,
      candidateStart: date,
      serviceId: service_id,
      staffUserId: hasStaffCol ? staff_user_id ?? null : null,
    });
  }

  let res;
  if (hasStaffCol && hasLoyCol) {
    res = await pool.query(
      `INSERT INTO appointments(
         client_id, service_id, date, organization_id, status, staff_user_id,
         redeems_loyalty, loyalty_program_id
       )
       VALUES($1, $2, $3, $4, COALESCE($5, 'scheduled'), $6, $7, $8)
       RETURNING id`,
      [
        client_id,
        service_id,
        date,
        orgId,
        status ?? null,
        staff_user_id ?? null,
        redeem,
        loyaltyPid,
      ]
    );
  } else if (hasStaffCol) {
    res = await pool.query(
      `INSERT INTO appointments(client_id, service_id, date, organization_id, status, staff_user_id)
       VALUES($1, $2, $3, $4, COALESCE($5, 'scheduled'), $6)
       RETURNING id`,
      [client_id, service_id, date, orgId, status ?? null, staff_user_id ?? null]
    );
  } else if (hasLoyCol) {
    res = await pool.query(
      `INSERT INTO appointments(
         client_id, service_id, date, organization_id, status,
         redeems_loyalty, loyalty_program_id
       )
       VALUES($1, $2, $3, $4, COALESCE($5, 'scheduled'), $6, $7)
       RETURNING id`,
      [
        client_id,
        service_id,
        date,
        orgId,
        status ?? null,
        redeem,
        loyaltyPid,
      ]
    );
  } else {
    res = await pool.query(
      `INSERT INTO appointments(client_id, service_id, date, organization_id, status)
       VALUES($1, $2, $3, $4, COALESCE($5, 'scheduled'))
       RETURNING id`,
      [client_id, service_id, date, orgId, status ?? null]
    );
  }

  const row = await getById(res.rows[0].id, orgId);
  if (hasLoyCol && row.status === "completed") {
    const loyaltyService = require("../loyalty/loyalty.service");
    await loyaltyService.applyCompletedVisit(orgId, row, null);
  }
  return row;
}

async function update(id, data, orgId) {
  await assertAppointmentInOrg(id, orgId);

  const hasStaffCol = await hasAppointmentStaffUserColumn();
  const hasLoyCol = await hasLoyaltyAppointmentColumns();
  const prevSql = hasStaffCol
    ? hasLoyCol
      ? `SELECT status, service_id, staff_user_id, date, client_id,
                redeems_loyalty, loyalty_program_id
           FROM appointments WHERE id = $1 AND organization_id = $2`
      : `SELECT status, service_id, staff_user_id, date, client_id
           FROM appointments WHERE id = $1 AND organization_id = $2`
    : hasLoyCol
      ? `SELECT status, service_id, date, client_id,
                redeems_loyalty, loyalty_program_id
           FROM appointments WHERE id = $1 AND organization_id = $2`
      : `SELECT status, service_id, date, client_id
           FROM appointments WHERE id = $1 AND organization_id = $2`;
  const prevRow = await pool.query(prevSql, [id, orgId]);
  const previousStatus = prevRow.rows[0].status;
  const cur = prevRow.rows[0];
  const nextService =
    data.service_id !== undefined ? data.service_id : cur.service_id;
  const nextStaff = hasStaffCol
    ? data.staff_user_id !== undefined
      ? data.staff_user_id
      : cur.staff_user_id
    : null;
  const nextDate = data.date !== undefined ? data.date : cur.date;
  const nextStatus =
    data.status !== undefined ? data.status : previousStatus;

  if (hasLoyCol && data.redeems_loyalty === true) {
    const pid =
      data.loyalty_program_id !== undefined
        ? data.loyalty_program_id
        : cur.loyalty_program_id;
    const cid =
      data.client_id !== undefined ? data.client_id : cur.client_id;
    const sid =
      data.service_id !== undefined ? data.service_id : cur.service_id;
    if (!pid) {
      const err = new Error(
        "Za iskorišćenje nagrade potreban je loyalty_program_id."
      );
      err.statusCode = 400;
      throw err;
    }
    const loyaltyService = require("../loyalty/loyalty.service");
    await loyaltyService.assertRedeemAllowed(orgId, cid, pid, sid);
  }

  if (!hasStaffCol && data.staff_user_id !== undefined) {
    const err = new Error(
      "Dodela radnika zahteva migraciju baze (006_appointments_staff_user)."
    );
    err.statusCode = 400;
    throw err;
  }
  await assertStaffUserInOrg(orgId, nextStaff, nextService);

  const {
    client_id,
    service_id,
    date,
    status,
    staff_user_id,
    redeems_loyalty,
    loyalty_program_id,
  } = data;
  if (client_id !== undefined) {
    await assertClientInOrg(client_id, orgId);
  }
  if (service_id !== undefined) {
    await assertServiceInOrg(service_id, orgId);
  }

  const allowed = [
    "client_id",
    "service_id",
    "date",
    "status",
    "staff_user_id",
    ...(hasLoyCol ? (["redeems_loyalty", "loyalty_program_id"] ) : []),
  ];
  let entries = Object.entries({
    client_id,
    service_id,
    date,
    status,
    staff_user_id,
    redeems_loyalty,
    loyalty_program_id,
  }).filter(([k, v]) => allowed.includes(k) && v !== undefined);
  if (!hasStaffCol) {
    entries = entries.filter(([k]) => k !== "staff_user_id");
  }
  if (entries.length === 0) {
    return getById(id, orgId);
  }

  if (nextStatus === "scheduled") {
    await assertNoStaffScheduleOverlap({
      orgId,
      excludeAppointmentId: Number(id),
      candidateStart: nextDate,
      serviceId: nextService,
      staffUserId: hasStaffCol ? nextStaff ?? null : null,
    });
  }

  const setClauses = [];
  const values = [];
  let n = 1;
  for (const [key, val] of entries) {
    setClauses.push(`${key} = $${n++}`);
    values.push(val);
  }
  values.push(id, orgId);
  await pool.query(
    `UPDATE appointments SET ${setClauses.join(", ")}
     WHERE id = $${n} AND organization_id = $${n + 1}`,
    values
  );
  const updated = await getById(id, orgId);

  if (
    data.status !== undefined &&
    data.status === "no_show" &&
    previousStatus !== "no_show"
  ) {
    const { sendNoShowNotification } = require("./appointments.notify");
    setImmediate(() => {
      sendNoShowNotification(orgId, updated).catch((e) =>
        console.error("No-show notification failed", e)
      );
    });
  }

  if (
    hasLoyCol &&
    updated.status === "completed" &&
    previousStatus !== "completed"
  ) {
    const loyaltyService = require("../loyalty/loyalty.service");
    await loyaltyService.applyCompletedVisit(orgId, updated, previousStatus);
  }

  return updated;
}

async function remove(id, orgId, actorUserId) {
  const existing = await getById(id, orgId);
  if (!existing) {
    const err = new Error("Not found");
    err.statusCode = 404;
    throw err;
  }
  await pool.query(
    `DELETE FROM appointments WHERE id = $1 AND organization_id = $2`,
    [id, orgId]
  );
  const auditService = require("../audit/audit.service");
  await auditService.insertRow({
    organizationId: orgId,
    userId: actorUserId,
    action: "appointment_delete",
    entityType: "appointment",
    entityId: Number(id),
    meta: {
      client_id: existing.client_id,
      service_id: existing.service_id,
    },
  });
}

module.exports = {
  hasAppointmentStaffUserColumn,
  hasLoyaltyAppointmentColumns,
  getAll,
  getByDay,
  getByDateRange,
  getById,
  create,
  update,
  remove,
};
