const service = require("./supplies.service");

async function list(req, res) {
  const data = await service.listItems(req.user.orgId);
  res.json(data);
}

async function getOne(req, res) {
  const row = await service.getOne(req.validatedParams.id, req.user.orgId);
  if (!row) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json(row);
}

async function create(req, res) {
  const row = await service.createItem(req.user.orgId, req.body);
  res.status(201).json(row);
}

async function update(req, res) {
  const row = await service.updateItem(
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
  const ok = await service.removeItem(req.validatedParams.id, req.user.orgId);
  if (!ok) {
    return res.status(404).json({ error: "Not found" });
  }
  res.status(204).send();
}

async function listMovements(req, res) {
  const data = await service.listMovements(req.user.orgId, req.validatedQuery);
  res.json(data);
}

async function createMovement(req, res) {
  const result = await service.addMovement(
    req.user.orgId,
    req.user.userId,
    req.body
  );
  res.status(201).json(result);
}

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  listMovements,
  createMovement,
};
