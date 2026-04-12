const service = require("./services.service");
const auditService = require("../audit/audit.service");

async function getAll(req, res) {
  const data = await service.getAll(req.user.orgId);
  res.json(data);
}

async function getById(req, res) {
  const data = await service.getById(req.validatedParams.id, req.user.orgId);
  res.json(data);
}

async function create(req, res) {
  const data = await service.create(req.body, req.user.orgId);
  await auditService.insertRow({
    organizationId: req.user.orgId,
    userId: req.user.userId,
    action: "service_create",
    entityType: "service",
    entityId: data.id,
    meta: { name: data.name },
  });
  res.status(201).json(data);
}

async function update(req, res) {
  const data = await service.update(
    req.validatedParams.id,
    req.body,
    req.user.orgId
  );
  const changed = Object.keys(req.body ?? {}).filter(
    (k) => req.body[k] !== undefined
  );
  await auditService.insertRow({
    organizationId: req.user.orgId,
    userId: req.user.userId,
    action: "service_update",
    entityType: "service",
    entityId: data.id,
    meta: { name: data.name, changed },
  });
  res.json(data);
}

async function remove(req, res) {
  const id = req.validatedParams.id;
  const existing = await service.getById(id, req.user.orgId);
  await service.remove(id, req.user.orgId);
  await auditService.insertRow({
    organizationId: req.user.orgId,
    userId: req.user.userId,
    action: "service_delete",
    entityType: "service",
    entityId: id,
    meta: { name: existing.name },
  });
  res.status(204).send();
}

module.exports = { getAll, getById, create, update, remove };
