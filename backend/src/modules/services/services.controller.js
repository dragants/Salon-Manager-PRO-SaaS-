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

module.exports = { getAll, getById, create, update, remove, getCategories, createCategory, updateCategory, removeCategory };

/* ── Categories ── */

async function getCategories(req, res) {
  const data = await service.getAllCategories(req.user.orgId);
  res.json(data);
}

async function createCategory(req, res) {
  const data = await service.createCategory(req.body, req.user.orgId);
  await auditService.insertRow({
    organizationId: req.user.orgId,
    userId: req.user.userId,
    action: "service_category_create",
    entityType: "service_category",
    entityId: data.id,
    meta: { name: data.name },
  });
  res.status(201).json(data);
}

async function updateCategory(req, res) {
  const data = await service.updateCategory(
    req.validatedParams.id,
    req.body,
    req.user.orgId
  );
  await auditService.insertRow({
    organizationId: req.user.orgId,
    userId: req.user.userId,
    action: "service_category_update",
    entityType: "service_category",
    entityId: data.id,
    meta: { name: data.name },
  });
  res.json(data);
}

async function removeCategory(req, res) {
  const id = req.validatedParams.id;
  await service.removeCategory(id, req.user.orgId);
  await auditService.insertRow({
    organizationId: req.user.orgId,
    userId: req.user.userId,
    action: "service_category_delete",
    entityType: "service_category",
    entityId: id,
    meta: {},
  });
  res.status(204).send();
}
