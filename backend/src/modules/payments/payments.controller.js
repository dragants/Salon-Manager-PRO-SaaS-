const service = require("./payments.service");
const auditService = require("../audit/audit.service");

async function getAll(req, res) {
  const data = await service.getAll(req.user.orgId);
  res.json(data);
}

async function create(req, res) {
  const data = await service.create(req.body, req.user.orgId);
  await auditService.insertRow({
    organizationId: req.user.orgId,
    userId: req.user.userId,
    action: "payment_create",
    entityType: "payment",
    entityId: data.id,
    meta: { amount: String(data.amount) },
  });
  res.status(201).json(data);
}

module.exports = { getAll, create };
