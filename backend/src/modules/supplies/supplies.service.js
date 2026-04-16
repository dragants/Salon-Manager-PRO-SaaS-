const pool = require("../../config/db");

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

function num(v) {
  if (v == null) return 0;
  return Number(v);
}

function mapItem(row) {
  return {
    id: Number(row.id),
    organization_id: Number(row.organization_id),
    name: row.name,
    unit: row.unit,
    quantity: num(row.quantity),
    reorder_min:
      row.reorder_min != null ? num(row.reorder_min) : null,
    notes: row.notes ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapMovement(row) {
  return {
    id: Number(row.id),
    supply_item_id: Number(row.supply_item_id),
    item_name: row.item_name ?? null,
    delta_qty: num(row.delta_qty),
    movement_type: row.movement_type,
    note: row.note ?? null,
    appointment_id:
      row.appointment_id != null ? Number(row.appointment_id) : null,
    created_at: row.created_at,
  };
}

function computeDelta(movementType, currentQty, body) {
  if (movementType === "purchase") {
    if (body.quantity == null) {
      throw badRequest("Za nabavku je obavezna količina (quantity).");
    }
    return num(body.quantity);
  }
  if (movementType === "usage") {
    if (body.quantity == null) {
      throw badRequest("Za potrošnju je obavezna količina (quantity).");
    }
    return -num(body.quantity);
  }
  if (movementType === "adjustment") {
    if (body.target_quantity == null) {
      throw badRequest("Za korekciju je obavezna target_quantity.");
    }
    return num(body.target_quantity) - currentQty;
  }
  throw badRequest("Nepoznat tip kretanja.");
}

async function assertAppointmentInOrg(client, orgId, appointmentId) {
  if (appointmentId == null) return;
  const r = await client.query(
    `SELECT 1 FROM appointments WHERE id = $1 AND organization_id = $2`,
    [appointmentId, orgId]
  );
  if (r.rows.length === 0) {
    throw badRequest("Termin nije pronađen u ovoj organizaciji.");
  }
}

async function listItems(orgId) {
  const r = await pool.query(
    `SELECT id, organization_id, name, unit, quantity, reorder_min, notes,
            created_at, updated_at
     FROM supply_items
     WHERE organization_id = $1
     ORDER BY lower(name), id`,
    [orgId]
  );
  return r.rows.map(mapItem);
}

async function getOne(id, orgId) {
  const r = await pool.query(
    `SELECT id, organization_id, name, unit, quantity, reorder_min, notes,
            created_at, updated_at
     FROM supply_items
     WHERE id = $1 AND organization_id = $2`,
    [id, orgId]
  );
  if (r.rows.length === 0) return null;
  return mapItem(r.rows[0]);
}

async function createItem(orgId, body) {
  const r = await pool.query(
    `INSERT INTO supply_items (
       organization_id, name, unit, reorder_min, notes
     ) VALUES ($1, $2, $3, $4, $5)
     RETURNING id, organization_id, name, unit, quantity, reorder_min, notes,
               created_at, updated_at`,
    [
      orgId,
      body.name.trim(),
      String(body.unit || "kom").trim() || "kom",
      body.reorder_min != null ? body.reorder_min : null,
      body.notes && String(body.notes).trim()
        ? String(body.notes).trim()
        : null,
    ]
  );
  return mapItem(r.rows[0]);
}

async function updateItem(id, orgId, patch) {
  const cur = await getOne(id, orgId);
  if (!cur) return null;

  const name = patch.name !== undefined ? patch.name.trim() : cur.name;
  const unit =
    patch.unit !== undefined
      ? String(patch.unit).trim() || cur.unit
      : cur.unit;
  const reorder_min =
    patch.reorder_min !== undefined ? patch.reorder_min : cur.reorder_min;
  const notes =
    patch.notes !== undefined
      ? patch.notes && String(patch.notes).trim()
        ? String(patch.notes).trim()
        : null
      : cur.notes;

  const r = await pool.query(
    `UPDATE supply_items SET
       name = $3,
       unit = $4,
       reorder_min = $5,
       notes = $6,
       updated_at = NOW()
     WHERE id = $1 AND organization_id = $2
     RETURNING id, organization_id, name, unit, quantity, reorder_min, notes,
               created_at, updated_at`,
    [id, orgId, name, unit, reorder_min, notes]
  );
  return mapItem(r.rows[0]);
}

async function removeItem(id, orgId) {
  const r = await pool.query(
    `DELETE FROM supply_items WHERE id = $1 AND organization_id = $2 RETURNING id`,
    [id, orgId]
  );
  return r.rowCount > 0;
}

async function listMovements(orgId, query) {
  const limit = query.limit ?? 80;
  const params = [orgId, limit];
  let where = "m.organization_id = $1";
  if (query.supply_item_id) {
    where += " AND m.supply_item_id = $3";
    params.push(query.supply_item_id);
  }
  const r = await pool.query(
    `SELECT m.id, m.supply_item_id, m.delta_qty, m.movement_type, m.note,
            m.appointment_id, m.created_at,
            i.name AS item_name
     FROM supply_movements m
     INNER JOIN supply_items i
       ON i.id = m.supply_item_id AND i.organization_id = m.organization_id
     WHERE ${where}
     ORDER BY m.created_at DESC, m.id DESC
     LIMIT $2`,
    params
  );
  return r.rows.map(mapMovement);
}

async function addMovement(orgId, userId, body) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const curR = await client.query(
      `SELECT quantity FROM supply_items
       WHERE id = $1 AND organization_id = $2
       FOR UPDATE`,
      [body.supply_item_id, orgId]
    );
    if (curR.rows.length === 0) {
      throw badRequest("Stavka nije pronađena.");
    }
    const currentQty = num(curR.rows[0].quantity);
    const delta = computeDelta(body.movement_type, currentQty, body);
    if (delta === 0) {
      await client.query("ROLLBACK");
      const row = await getOne(body.supply_item_id, orgId);
      return { skipped: true, item: row, movement: null };
    }
    const nextQty = currentQty + delta;
    if (nextQty < 0) {
      throw badRequest("Nedovoljno zalihe za ovu potrošnju.");
    }

    await assertAppointmentInOrg(client, orgId, body.appointment_id ?? null);

    const ins = await client.query(
      `INSERT INTO supply_movements (
         organization_id, supply_item_id, delta_qty, movement_type,
         note, appointment_id, created_by_user_id
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, supply_item_id, delta_qty, movement_type, note,
                 appointment_id, created_at`,
      [
        orgId,
        body.supply_item_id,
        delta,
        body.movement_type,
        body.note && String(body.note).trim()
          ? String(body.note).trim()
          : null,
        body.appointment_id ?? null,
        userId,
      ]
    );

    await client.query(
      `UPDATE supply_items SET quantity = $1, updated_at = NOW()
       WHERE id = $2 AND organization_id = $3`,
      [nextQty, body.supply_item_id, orgId]
    );

    await client.query("COMMIT");

    const item = await getOne(body.supply_item_id, orgId);
    const m = ins.rows[0];
    return {
      skipped: false,
      item,
      movement: mapMovement({
        ...m,
        item_name: item?.name ?? null,
      }),
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

module.exports = {
  listItems,
  getOne,
  createItem,
  updateItem,
  removeItem,
  listMovements,
  addMovement,
};
