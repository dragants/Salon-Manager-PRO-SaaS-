const service = require("./expenses.service");

async function list(req, res) {
  const { from, to } = req.validatedQuery;
  const data = await service.list(req.user.orgId, from, to);
  res.json(data);
}

async function create(req, res) {
  const row = await service.create(
    req.user.orgId,
    req.user.userId,
    req.body
  );
  res.status(201).json(row);
}

async function getOne(req, res) {
  const row = await service.getOne(req.validatedParams.id, req.user.orgId);
  if (!row) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json(row);
}

async function update(req, res) {
  const row = await service.update(
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
  const ok = await service.remove(req.validatedParams.id, req.user.orgId);
  if (!ok) {
    return res.status(404).json({ error: "Not found" });
  }
  res.status(204).send();
}

module.exports = { list, create, getOne, update, remove };
