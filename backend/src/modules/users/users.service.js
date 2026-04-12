const pool = require("../../config/db");
const { comparePassword, hashPassword } = require("../../utils/hash");
const auditService = require("../audit/audit.service");

function normalizeWorkerProfile(raw) {
  if (!raw || typeof raw !== "object") {
    return { service_ids: [], working_hours: {} };
  }
  const ids = Array.isArray(raw.service_ids)
    ? [...new Set(raw.service_ids.map(Number).filter(Number.isFinite))]
    : [];
  const wh =
    raw.working_hours && typeof raw.working_hours === "object"
      ? raw.working_hours
      : {};
  return { service_ids: ids, working_hours: wh };
}

function mapTeamRow(row) {
  const profile = row.worker_profile || {};
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    display_name: row.display_name ?? null,
    worker_profile:
      typeof profile === "object" && profile !== null ? profile : {},
    created_at: row.created_at,
  };
}

async function countAdmins(orgId) {
  const r = await pool.query(
    `SELECT COUNT(*)::int AS c FROM users
     WHERE organization_id = $1 AND role = 'admin'`,
    [orgId]
  );
  return r.rows[0].c;
}

async function assertServiceIdsForOrg(orgId, serviceIds) {
  if (!serviceIds || serviceIds.length === 0) {
    return;
  }
  const r = await pool.query(
    `SELECT COUNT(*)::int AS c FROM services
     WHERE organization_id = $1 AND id = ANY($2::int[])`,
    [orgId, serviceIds]
  );
  if (r.rows[0].c !== serviceIds.length) {
    const err = new Error("Jedna ili više usluga ne pripadaju ovom salonu.");
    err.statusCode = 400;
    throw err;
  }
}

async function getById(userId) {
  let res;
  try {
    res = await pool.query(
      `SELECT id, email, role, organization_id, display_name, created_at
       FROM users WHERE id = $1`,
      [userId]
    );
  } catch (e) {
    if (e.code !== "42703") {
      throw e;
    }
    res = await pool.query(
      `SELECT id, email, role, organization_id, created_at
       FROM users WHERE id = $1`,
      [userId]
    );
  }
  if (res.rows.length === 0) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  const row = res.rows[0];
  if (row.display_name === undefined) {
    row.display_name = null;
  }
  return row;
}

async function getTeamMember(orgId, userId) {
  let res;
  try {
    res = await pool.query(
      `SELECT id, email, role, organization_id, display_name, worker_profile, created_at
       FROM users WHERE id = $1 AND organization_id = $2`,
      [userId, orgId]
    );
  } catch (e) {
    if (e.code !== "42703") {
      throw e;
    }
    res = await pool.query(
      `SELECT id, email, role, organization_id, created_at
       FROM users WHERE id = $1 AND organization_id = $2`,
      [userId, orgId]
    );
  }
  if (res.rows.length === 0) {
    const err = new Error("Član tima nije pronađen.");
    err.statusCode = 404;
    throw err;
  }
  const row = res.rows[0];
  if (row.display_name === undefined) {
    row.display_name = null;
  }
  if (row.worker_profile === undefined) {
    row.worker_profile = {};
  }
  return row;
}

async function listByOrganization(orgId) {
  let res;
  try {
    res = await pool.query(
      `SELECT id, email, role, display_name, worker_profile, created_at
       FROM users WHERE organization_id = $1
       ORDER BY id ASC`,
      [orgId]
    );
  } catch (e) {
    if (e.code !== "42703") {
      throw e;
    }
    res = await pool.query(
      `SELECT id, email, role, created_at
       FROM users WHERE organization_id = $1
       ORDER BY id ASC`,
      [orgId]
    );
  }
  return res.rows.map((row) => {
    const r = { ...row };
    if (r.display_name === undefined) {
      r.display_name = null;
    }
    if (r.worker_profile === undefined) {
      r.worker_profile = {};
    }
    return mapTeamRow(r);
  });
}

async function changePassword(userId, currentPassword, newPassword) {
  const r = await pool.query(
    `SELECT id, password, organization_id FROM users WHERE id = $1`,
    [userId]
  );
  if (r.rows.length === 0) {
    const err = new Error("Korisnik nije pronađen.");
    err.statusCode = 404;
    throw err;
  }
  const row = r.rows[0];
  const ok = await comparePassword(currentPassword, row.password);
  if (!ok) {
    const err = new Error("Trenutna lozinka nije ispravna.");
    err.statusCode = 403;
    throw err;
  }
  const hashed = await hashPassword(newPassword);
  try {
    await pool.query(
      `UPDATE users
       SET password = $1,
           token_version = COALESCE(token_version, 0) + 1
       WHERE id = $2`,
      [hashed, userId]
    );
  } catch (e) {
    if (e.code !== "42703") {
      throw e;
    }
    await pool.query(`UPDATE users SET password = $1 WHERE id = $2`, [
      hashed,
      userId,
    ]);
  }
  await auditService.insertRow({
    organizationId: row.organization_id,
    userId,
    action: "password_change",
    entityType: "user",
    entityId: userId,
    meta: {},
  });
}

async function createInOrganization(orgId, body) {
  const { email, password, role, display_name } = body;
  const normalizedEmail = String(email).trim().toLowerCase();
  const hashed = await hashPassword(password);
  const dn =
    display_name != null && String(display_name).trim() !== ""
      ? String(display_name).trim()
      : null;
  try {
    const res = await pool.query(
      `INSERT INTO users (email, password, organization_id, role, display_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, role, display_name, worker_profile, created_at`,
      [normalizedEmail, hashed, orgId, role, dn]
    );
    return mapTeamRow(res.rows[0]);
  } catch (e) {
    if (e.code === "23505") {
      const err = new Error("Ovaj email je već registrovan.");
      err.statusCode = 409;
      throw err;
    }
    throw e;
  }
}

async function updateTeamMember(orgId, targetUserId, body) {
  const row = await getTeamMember(orgId, targetUserId);
  const updates = [];
  const vals = [];
  let n = 1;

  if (body.display_name !== undefined) {
    updates.push(`display_name = $${n++}`);
    const v = body.display_name;
    vals.push(
      v != null && String(v).trim() !== "" ? String(v).trim() : null
    );
  }

  if (body.role !== undefined) {
    if (row.role === "admin" && body.role === "worker") {
      const admins = await countAdmins(orgId);
      if (admins <= 1) {
        const err = new Error(
          "Ne može se ukloniti uloga administratora poslednjem adminu."
        );
        err.statusCode = 409;
        throw err;
      }
    }
    updates.push(`role = $${n++}`);
    vals.push(body.role);
  }

  if (body.email !== undefined) {
    updates.push(`email = $${n++}`);
    vals.push(String(body.email).trim().toLowerCase());
  }

  if (body.worker_profile !== undefined) {
    const norm = normalizeWorkerProfile(body.worker_profile);
    await assertServiceIdsForOrg(orgId, norm.service_ids);
    updates.push(`worker_profile = $${n++}::jsonb`);
    vals.push(JSON.stringify(norm));
  }

  if (body.password !== undefined) {
    const hashed = await hashPassword(body.password);
    updates.push(`password = $${n++}`);
    vals.push(hashed);
    updates.push(`token_version = COALESCE(token_version, 0) + 1`);
  }

  if (updates.length === 0) {
    return mapTeamRow(row);
  }

  vals.push(targetUserId, orgId);
  const whereId = n++;
  const whereOrg = n;
  try {
    const res = await pool.query(
      `UPDATE users SET ${updates.join(", ")}
       WHERE id = $${whereId} AND organization_id = $${whereOrg}
       RETURNING id, email, role, display_name, worker_profile, created_at`,
      vals
    );
    return mapTeamRow(res.rows[0]);
  } catch (e) {
    if (e.code === "23505") {
      const err = new Error("Ovaj email je već registrovan.");
      err.statusCode = 409;
      throw err;
    }
    if (e.code === "42703" && body.password !== undefined) {
      const updatesNoTv = updates.filter(
        (u) => !String(u).includes("token_version")
      );
      const res = await pool.query(
        `UPDATE users SET ${updatesNoTv.join(", ")}
         WHERE id = $${whereId} AND organization_id = $${whereOrg}
         RETURNING id, email, role, display_name, worker_profile, created_at`,
        vals
      );
      return mapTeamRow(res.rows[0]);
    }
    throw e;
  }
}

async function removeTeamMember(actorUserId, orgId, targetUserId) {
  if (Number(actorUserId) === Number(targetUserId)) {
    const err = new Error("Ne možeš obrisati sopstveni nalog.");
    err.statusCode = 403;
    throw err;
  }
  const row = await getTeamMember(orgId, targetUserId);
  if (row.role === "admin") {
    const admins = await countAdmins(orgId);
    if (admins <= 1) {
      const err = new Error("Ne može se ukloniti poslednji administrator.");
      err.statusCode = 409;
      throw err;
    }
  }
  await pool.query(
    `DELETE FROM users WHERE id = $1 AND organization_id = $2`,
    [targetUserId, orgId]
  );
}

module.exports = {
  normalizeWorkerProfile,
  getById,
  getTeamMember,
  listByOrganization,
  createInOrganization,
  updateTeamMember,
  removeTeamMember,
  changePassword,
  mapTeamRow,
};
