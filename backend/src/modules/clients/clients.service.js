const fs = require("fs");
const path = require("path");
const pool = require("../../config/db");
const {
  hasAppointmentStaffUserColumn,
} = require("../appointments/appointments.service");
const { UPLOAD_ROOT } = require("../../config/env");
const {
  writeClientFile,
  readClientFile,
  deleteClientFolder,
} = require("../../utils/clientUploads");
const { assertCanAddClient } = require("../../services/plan-limits.service");

const MAX_FILE_BYTES = 5 * 1024 * 1024;

async function getAll(orgId) {
  const reg = await pool.query(
    `SELECT to_regclass('public.client_loyalty_balances') AS reg`
  );
  const hasLoyalty = Boolean(reg.rows[0]?.reg);

  const loyaltyJoin = hasLoyalty
    ? `LEFT JOIN (
         SELECT client_id,
                COALESCE(SUM(stamps), 0)::int AS loyalty_stamps,
                COALESCE(SUM(rewards_available), 0)::int AS loyalty_rewards
         FROM client_loyalty_balances
         WHERE organization_id = $1
         GROUP BY client_id
       ) loy ON loy.client_id = c.id`
    : `LEFT JOIN (
         SELECT NULL::int AS client_id,
                0::int AS loyalty_stamps,
                0::int AS loyalty_rewards
         WHERE FALSE
       ) loy ON FALSE`;

  const res = await pool.query(
    `SELECT c.*,
            agg.last_visit_at,
            COALESCE(agg.total_spent, 0)::numeric AS total_spent,
            COALESCE(loy.loyalty_stamps, 0)::int AS loyalty_stamps,
            COALESCE(loy.loyalty_rewards, 0)::int AS loyalty_rewards
     FROM clients c
     LEFT JOIN (
       SELECT a.client_id,
              MAX(a.date) FILTER (WHERE a.status = 'completed') AS last_visit_at,
              COALESCE(
                SUM(s.price::numeric) FILTER (WHERE a.status = 'completed'),
                0
              ) AS total_spent
       FROM appointments a
       INNER JOIN services s
         ON s.id = a.service_id AND s.organization_id = a.organization_id
       WHERE a.organization_id = $1
       GROUP BY a.client_id
     ) agg ON agg.client_id = c.id
     ${loyaltyJoin}
     WHERE c.organization_id = $1
     ORDER BY c.id DESC`,
    [orgId]
  );
  return res.rows;
}

async function getOne(id, orgId) {
  const res = await pool.query(
    "SELECT * FROM clients WHERE id = $1 AND organization_id = $2",
    [id, orgId]
  );
  return res.rows[0];
}

async function getDetail(clientId, orgId) {
  const client = await getOne(clientId, orgId);
  if (!client) {
    return null;
  }

  const apptSql = (await hasAppointmentStaffUserColumn())
    ? `SELECT a.id, a.date, a.status, s.name AS service_name, s.duration,
            a.staff_user_id,
            u.display_name AS staff_display_name,
            u.email AS staff_email
     FROM appointments a
     INNER JOIN services s ON s.id = a.service_id
     LEFT JOIN users u ON u.id = a.staff_user_id AND u.organization_id = a.organization_id
     WHERE a.client_id = $1 AND a.organization_id = $2
     ORDER BY a.date DESC
     LIMIT 200`
    : `SELECT a.id, a.date, a.status, s.name AS service_name, s.duration,
            NULL::int AS staff_user_id,
            NULL::text AS staff_display_name,
            NULL::text AS staff_email
     FROM appointments a
     INNER JOIN services s ON s.id = a.service_id
     WHERE a.client_id = $1 AND a.organization_id = $2
     ORDER BY a.date DESC
     LIMIT 200`;
  const apptRes = await pool.query(apptSql, [clientId, orgId]);

  let loyalty_balances = [];
  const reg = await pool.query(
    `SELECT to_regclass('public.loyalty_programs') AS reg`
  );
  if (reg.rows[0]?.reg) {
    const loyaltyService = require("../loyalty/loyalty.service");
    loyalty_balances = await loyaltyService.balancesForClient(clientId, orgId);
  }

  const chartRes = await pool.query(
    `SELECT e.id, e.visit_at, e.title, e.notes, e.appointment_id, e.created_at,
       COALESCE(
         (
           SELECT json_agg(
             json_build_object(
               'id', f.id,
               'original_name', f.original_name,
               'mime_type', f.mime_type,
               'size_bytes', COALESCE(f.file_size_bytes, octet_length(f.data), 0)
             )
             ORDER BY f.id
           )
           FROM client_chart_files f
           WHERE f.chart_entry_id = e.id
         ),
         '[]'::json
       ) AS attachments
     FROM client_chart_entries e
     WHERE e.client_id = $1 AND e.organization_id = $2
     ORDER BY e.visit_at DESC NULLS LAST, e.id DESC`,
    [clientId, orgId]
  );

  return {
    client,
    appointments: apptRes.rows,
    chart_entries: chartRes.rows,
    loyalty_balances,
  };
}

async function assertAppointmentForClient(
  appointmentId,
  clientId,
  orgId
) {
  const res = await pool.query(
    `SELECT id FROM appointments
     WHERE id = $1 AND client_id = $2 AND organization_id = $3`,
    [appointmentId, clientId, orgId]
  );
  if (res.rows.length === 0) {
    const err = new Error("Appointment not found for this client");
    err.statusCode = 400;
    throw err;
  }
}

function unlinkRelative(rel) {
  if (!rel) {
    return;
  }
  const full = path.join(UPLOAD_ROOT, rel.split("/").join(path.sep));
  try {
    if (fs.existsSync(full)) {
      fs.unlinkSync(full);
    }
  } catch {
    /* ignore */
  }
}

async function addChartEntry(clientId, orgId, body) {
  const client = await getOne(clientId, orgId);
  if (!client) {
    const err = new Error("Not found");
    err.statusCode = 404;
    throw err;
  }

  if (body.appointment_id) {
    await assertAppointmentForClient(
      body.appointment_id,
      clientId,
      orgId
    );
  }

  const files = body.files || [];
  const buffers = [];
  for (const f of files) {
    let buf;
    try {
      buf = Buffer.from(f.data_base64, "base64");
    } catch {
      const err = new Error("Invalid file encoding");
      err.statusCode = 400;
      throw err;
    }
    if (!buf.length || buf.length > MAX_FILE_BYTES) {
      const err = new Error(
        `Each file must be between 1 byte and ${MAX_FILE_BYTES} bytes`
      );
      err.statusCode = 400;
      throw err;
    }
    buffers.push({
      filename: f.filename,
      mime_type: f.mime_type,
      buf,
    });
  }

  const visitAt = body.visit_at ? new Date(body.visit_at) : new Date();
  const title = body.title != null ? String(body.title).trim() || null : null;
  const notes = body.notes != null ? String(body.notes).trim() || null : null;

  const conn = await pool.connect();
  const writtenPaths = [];
  try {
    await conn.query("BEGIN");
    const ins = await conn.query(
      `INSERT INTO client_chart_entries
 (organization_id, client_id, visit_at, title, notes, appointment_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        orgId,
        clientId,
        visitAt,
        title,
        notes,
        body.appointment_id ?? null,
      ]
    );
    const entry = ins.rows[0];

    for (const b of buffers) {
      const storagePath = writeClientFile(
        orgId,
        clientId,
        b.filename,
        b.buf
      );
      writtenPaths.push(storagePath);
      await conn.query(
        `INSERT INTO client_chart_files
          (organization_id, chart_entry_id, original_name, mime_type, data, storage_path, file_size_bytes)
         VALUES ($1, $2, $3, $4, NULL, $5, $6)`,
        [
          orgId,
          entry.id,
          b.filename,
          b.mime_type,
          storagePath,
          b.buf.length,
        ]
      );
    }

    await conn.query("COMMIT");
    return entry;
  } catch (e) {
    await conn.query("ROLLBACK");
    for (const rel of writtenPaths) {
      unlinkRelative(rel);
    }
    throw e;
  } finally {
    conn.release();
  }
}

async function getChartFilePayload(fileId, orgId) {
  const res = await pool.query(
    `SELECT f.original_name, f.mime_type, f.data, f.storage_path, e.client_id
     FROM client_chart_files f
     INNER JOIN client_chart_entries e ON e.id = f.chart_entry_id
     WHERE f.id = $1 AND f.organization_id = $2`,
    [fileId, orgId]
  );
  if (res.rows.length === 0) {
    return null;
  }
  const row = res.rows[0];
  if (row.storage_path) {
    const buf = readClientFile(orgId, row.client_id, row.storage_path);
    if (!buf) {
      return null;
    }
    return {
      original_name: row.original_name,
      mime_type: row.mime_type,
      data: buf,
    };
  }
  if (row.data) {
    return {
      original_name: row.original_name,
      mime_type: row.mime_type,
      data: row.data,
    };
  }
  return null;
}

async function assertChartFileBelongsToClient(fileId, clientId, orgId) {
  const res = await pool.query(
    `SELECT f.id
     FROM client_chart_files f
     INNER JOIN client_chart_entries e ON e.id = f.chart_entry_id
     WHERE f.id = $1 AND e.client_id = $2 AND f.organization_id = $3`,
    [fileId, clientId, orgId]
  );
  return res.rows.length > 0;
}

async function create(data, orgId) {
  await assertCanAddClient(orgId);

  const { name, phone, notes } = data;
  const email =
    data.email != null && String(data.email).trim() !== ""
      ? String(data.email).trim().toLowerCase()
      : null;

  const res = await pool.query(
    `INSERT INTO clients(name, phone, notes, email, organization_id)
     VALUES($1, $2, $3, $4, $5) RETURNING *`,
    [name, phone, notes, email, orgId]
  );

  return res.rows[0];
}

async function update(id, data, orgId) {
  const existing = await getOne(id, orgId);
  if (!existing) {
    const err = new Error("Not found");
    err.statusCode = 404;
    throw err;
  }

  const name = data.name !== undefined ? data.name : existing.name;
  const phone = data.phone !== undefined ? data.phone : existing.phone;
  const notes = data.notes !== undefined ? data.notes : existing.notes;
  let email = existing.email;
  if (data.email !== undefined) {
    email =
      data.email != null && String(data.email).trim() !== ""
        ? String(data.email).trim().toLowerCase()
        : null;
  }

  const res = await pool.query(
    `UPDATE clients
     SET name = $1, phone = $2, notes = $3, email = $4
     WHERE id = $5 AND organization_id = $6
     RETURNING *`,
    [name, phone, notes, email, id, orgId]
  );

  return res.rows[0];
}

async function remove(id, orgId, actorUserId) {
  const existing = await getOne(id, orgId);
  if (!existing) {
    const err = new Error("Not found");
    err.statusCode = 404;
    throw err;
  }
  deleteClientFolder(orgId, id);
  await pool.query(
    "DELETE FROM clients WHERE id = $1 AND organization_id = $2",
    [id, orgId]
  );
  const auditService = require("../audit/audit.service");
  await auditService.insertRow({
    organizationId: orgId,
    userId: actorUserId,
    action: "client_delete",
    entityType: "client",
    entityId: Number(id),
    meta: { name: existing.name },
  });
}

module.exports = {
  getAll,
  getOne,
  getDetail,
  addChartEntry,
  getChartFilePayload,
  assertChartFileBelongsToClient,
  create,
  update,
  remove,
};
