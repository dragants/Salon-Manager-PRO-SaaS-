const service = require("./loyalty.service");

async function eligibility(req, res) {
  const { client_id, service_id } = req.validatedQuery;
  const data = await service.eligibilityForBooking(
    req.user.orgId,
    client_id,
    service_id
  );
  res.json(data);
}

async function list(req, res) {
  const data = await service.listPrograms(req.user.orgId);
  res.json(data);
}

async function create(req, res) {
  const row = await service.createProgram(req.user.orgId, req.body);
  res.status(201).json(row);
}

async function update(req, res) {
  const row = await service.updateProgram(
    req.validatedParams.id,
    req.user.orgId,
    req.body
  );
  if (!row) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json(row);
}

async function remove(req, res) {
  const ok = await service.removeProgram(req.validatedParams.id, req.user.orgId);
  if (!ok) {
    return res.status(404).json({ error: "Not found" });
  }
  res.status(204).send();
}

module.exports = { eligibility, list, create, update, remove };
