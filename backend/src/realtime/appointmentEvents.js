/**
 * SSE hub za `/appointments/stream` (token u ?token=).
 * Poruke: `{ type: "appointments", event, payload? }` — vidi emit u appointments/booking kontrolerima.
 */
/** @type {Map<number, Set<import('http').ServerResponse>>} */
const clientsByOrg = new Map();

/**
 * @param {number} orgId
 * @param {import('http').ServerResponse} res
 */
function subscribe(orgId, res) {
  const id = Number(orgId);
  if (!Number.isFinite(id)) {
    return;
  }
  let set = clientsByOrg.get(id);
  if (!set) {
    set = new Set();
    clientsByOrg.set(id, set);
  }
  set.add(res);
}

/**
 * @param {number} orgId
 * @param {import('http').ServerResponse} res
 */
function unsubscribe(orgId, res) {
  const id = Number(orgId);
  const set = clientsByOrg.get(id);
  if (!set) {
    return;
  }
  set.delete(res);
  if (set.size === 0) {
    clientsByOrg.delete(id);
  }
}

/**
 * @param {number} orgId
 * @param {Record<string, unknown>} payload
 */
function emitAppointmentChange(orgId, payload) {
  const id = Number(orgId);
  const set = clientsByOrg.get(id);
  if (!set || set.size === 0) {
    return;
  }
  const line = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of set) {
    try {
      res.write(line);
    } catch {
      set.delete(res);
    }
  }
}

module.exports = {
  subscribe,
  unsubscribe,
  emitAppointmentChange,
};
