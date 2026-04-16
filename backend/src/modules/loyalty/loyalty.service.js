const pool = require("../../config/db");

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

async function listPrograms(orgId) {
  const r = await pool.query(
    `SELECT p.id, p.organization_id, p.service_id, p.name, p.visits_required,
            p.is_active, p.created_at, p.updated_at,
            s.name AS service_name
     FROM loyalty_programs p
     INNER JOIN services s
       ON s.id = p.service_id AND s.organization_id = p.organization_id
     WHERE p.organization_id = $1
     ORDER BY lower(s.name), p.id`,
    [orgId]
  );
  return r.rows.map((row) => ({
    id: Number(row.id),
    organization_id: Number(row.organization_id),
    service_id: Number(row.service_id),
    service_name: row.service_name,
    name: row.name,
    visits_required: Number(row.visits_required),
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

async function createProgram(orgId, body) {
  await assertServiceInOrg(body.service_id, orgId);
  try {
    const r = await pool.query(
      `INSERT INTO loyalty_programs (
         organization_id, service_id, name, visits_required, is_active
       ) VALUES ($1, $2, $3, $4, COALESCE($5, TRUE))
       RETURNING id, organization_id, service_id, name, visits_required,
                 is_active, created_at, updated_at`,
      [
        orgId,
        body.service_id,
        body.name.trim(),
        body.visits_required,
        body.is_active,
      ]
    );
    const row = r.rows[0];
    const s = await pool.query(
      `SELECT name FROM services WHERE id = $1 AND organization_id = $2`,
      [row.service_id, orgId]
    );
    return {
      id: Number(row.id),
      organization_id: Number(row.organization_id),
      service_id: Number(row.service_id),
      service_name: s.rows[0]?.name ?? "",
      name: row.name,
      visits_required: Number(row.visits_required),
      is_active: Boolean(row.is_active),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  } catch (e) {
    if (e.code === "23505") {
      throw badRequest("Za ovu uslugu već postoji loyalty program.");
    }
    throw e;
  }
}

async function updateProgram(id, orgId, patch) {
  const cur = await pool.query(
    `SELECT * FROM loyalty_programs WHERE id = $1 AND organization_id = $2`,
    [id, orgId]
  );
  if (cur.rows.length === 0) return null;

  const name =
    patch.name !== undefined ? patch.name.trim() : cur.rows[0].name;
  const visits_required =
    patch.visits_required !== undefined
      ? patch.visits_required
      : cur.rows[0].visits_required;
  const is_active =
    patch.is_active !== undefined ? patch.is_active : cur.rows[0].is_active;

  const r = await pool.query(
    `UPDATE loyalty_programs SET
       name = $3,
       visits_required = $4,
       is_active = $5,
       updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING id, organization_id, service_id, name, visits_required,
               is_active, created_at, updated_at`,
    [id, orgId, name, visits_required, is_active]
  );
  const row = r.rows[0];
  const s = await pool.query(
    `SELECT name FROM services WHERE id = $1 AND organization_id = $2`,
    [row.service_id, orgId]
  );
  return {
    id: Number(row.id),
    organization_id: Number(row.organization_id),
    service_id: Number(row.service_id),
    service_name: s.rows[0]?.name ?? "",
    name: row.name,
    visits_required: Number(row.visits_required),
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function removeProgram(id, orgId) {
  const r = await pool.query(
    `DELETE FROM loyalty_programs WHERE id = $1 AND organization_id = $2 RETURNING id`,
    [id, orgId]
  );
  return r.rowCount > 0;
}

async function assertServiceInOrg(serviceId, orgId) {
  const r = await pool.query(
    `SELECT 1 FROM services WHERE id = $1 AND organization_id = $2`,
    [serviceId, orgId]
  );
  if (r.rows.length === 0) {
    throw badRequest("Usluga nije pronađena.");
  }
}

async function assertRedeemAllowed(orgId, clientId, programId, serviceId) {
  const p = await pool.query(
    `SELECT id, service_id FROM loyalty_programs
     WHERE id = $1 AND organization_id = $2 AND is_active = TRUE`,
    [programId, orgId]
  );
  if (p.rows.length === 0) {
    throw badRequest("Loyalty program nije aktivan ili ne postoji.");
  }
  if (Number(p.rows[0].service_id) !== Number(serviceId)) {
    throw badRequest("Program ne pripada izabranoj usluzi.");
  }
  const c = await pool.query(
    `SELECT 1 FROM clients WHERE id = $1 AND organization_id = $2`,
    [clientId, orgId]
  );
  if (c.rows.length === 0) {
    throw badRequest("Klijent nije pronađen.");
  }
  const b = await pool.query(
    `SELECT rewards_available FROM client_loyalty_balances
     WHERE organization_id = $1 AND client_id = $2 AND program_id = $3`,
    [orgId, clientId, programId]
  );
  const avail =
    b.rows.length > 0 ? Number(b.rows[0].rewards_available) : 0;
  if (avail < 1) {
    throw badRequest("Klijent nema dostupnu besplatnu posetu za ovaj program.");
  }
}

/**
 * Poziva se kad termin pređe u status completed.
 * @param {string|null|undefined} previousStatus — prethodni status (null za novo kreiran completed).
 */
async function applyCompletedVisit(orgId, appointmentRow, previousStatus) {
  if (previousStatus === "completed") {
    return;
  }
  if (appointmentRow.status !== "completed") {
    return;
  }

  const clientId = appointmentRow.client_id;
  const serviceId = appointmentRow.service_id;
  const redeems = Boolean(appointmentRow.redeems_loyalty);
  const programId = appointmentRow.loyalty_program_id;

  if (redeems) {
    if (!programId) {
      return;
    }
    await redeemOneReward(orgId, clientId, programId);
    return;
  }

  await addStampsForService(orgId, clientId, serviceId);
}

async function redeemOneReward(orgId, clientId, programId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const b = await client.query(
      `SELECT rewards_available FROM client_loyalty_balances
       WHERE organization_id = $1 AND client_id = $2 AND program_id = $3
       FOR UPDATE`,
      [orgId, clientId, programId]
    );
    if (b.rows.length === 0 || Number(b.rows[0].rewards_available) < 1) {
      throw badRequest("Nema dostupne nagrade za iskorišćenje.");
    }
    await client.query(
      `UPDATE client_loyalty_balances
       SET rewards_available = rewards_available - 1,
           updated_at = NOW()
       WHERE organization_id = $1 AND client_id = $2 AND program_id = $3`,
      [orgId, clientId, programId]
    );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function addStampsForService(orgId, clientId, serviceId) {
  const pro = await pool.query(
    `SELECT id, visits_required FROM loyalty_programs
     WHERE organization_id = $1 AND service_id = $2 AND is_active = TRUE`,
    [orgId, serviceId]
  );
  for (const p of pro.rows) {
    await bumpStamps(orgId, clientId, Number(p.id), Number(p.visits_required));
  }
}

async function bumpStamps(orgId, clientId, programId, visitsRequired) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ins = await client.query(
      `INSERT INTO client_loyalty_balances (
         organization_id, client_id, program_id, stamps, rewards_available
       ) VALUES ($1, $2, $3, 1, 0)
       ON CONFLICT (organization_id, client_id, program_id)
       DO UPDATE SET
         stamps = client_loyalty_balances.stamps + 1,
         updated_at = NOW()
       RETURNING stamps, rewards_available`,
      [orgId, clientId, programId]
    );
    let stamps = Number(ins.rows[0].stamps);
    let rewards = Number(ins.rows[0].rewards_available);
    while (stamps >= visitsRequired) {
      stamps -= visitsRequired;
      rewards += 1;
    }
    await client.query(
      `UPDATE client_loyalty_balances
       SET stamps = $1, rewards_available = $2, updated_at = NOW()
       WHERE organization_id = $3 AND client_id = $4 AND program_id = $5`,
      [stamps, rewards, orgId, clientId, programId]
    );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function eligibilityForBooking(orgId, clientId, serviceId) {
  const r = await pool.query(
    `SELECT p.id AS program_id, p.name, p.visits_required,
            COALESCE(b.stamps, 0)::int AS stamps,
            COALESCE(b.rewards_available, 0)::int AS rewards_available
     FROM loyalty_programs p
     LEFT JOIN client_loyalty_balances b
       ON b.program_id = p.id
      AND b.client_id = $2
      AND b.organization_id = p.organization_id
     WHERE p.organization_id = $1
       AND p.service_id = $3
       AND p.is_active = TRUE`,
    [orgId, clientId, serviceId]
  );
  return r.rows.map((row) => ({
    program_id: Number(row.program_id),
    name: row.name,
    visits_required: Number(row.visits_required),
    stamps: Number(row.stamps),
    rewards_available: Number(row.rewards_available),
  }));
}

async function balancesForClient(clientId, orgId) {
  const r = await pool.query(
    `SELECT b.program_id, b.stamps, b.rewards_available,
            p.name AS program_name, p.visits_required, p.service_id, p.is_active,
            s.name AS service_name
     FROM client_loyalty_balances b
     INNER JOIN loyalty_programs p
       ON p.id = b.program_id AND p.organization_id = b.organization_id
     INNER JOIN services s
       ON s.id = p.service_id AND s.organization_id = p.organization_id
     WHERE b.client_id = $1 AND b.organization_id = $2 AND p.is_active = TRUE
     ORDER BY lower(s.name), p.id`,
    [clientId, orgId]
  );
  return r.rows.map((row) => ({
    program_id: Number(row.program_id),
    program_name: row.program_name,
    service_id: Number(row.service_id),
    service_name: row.service_name,
    visits_required: Number(row.visits_required),
    stamps: Number(row.stamps),
    rewards_available: Number(row.rewards_available),
  }));
}

module.exports = {
  listPrograms,
  createProgram,
  updateProgram,
  removeProgram,
  assertRedeemAllowed,
  applyCompletedVisit,
  eligibilityForBooking,
  balancesForClient,
};
