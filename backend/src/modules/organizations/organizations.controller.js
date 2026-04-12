const service = require("./organizations.service");
const auditService = require("../audit/audit.service");

async function getCurrent(req, res) {
  const data = await service.getById(req.user.orgId);
  res.json(data);
}

async function patchSettings(req, res) {
  const data = await service.patchSettings(req.user.orgId, req.body);
  const fields = Object.keys(req.body ?? {}).filter(
    (k) => req.body[k] !== undefined
  );
  await auditService.insertRow({
    organizationId: req.user.orgId,
    userId: req.user.userId,
    action: "settings_patch",
    entityType: "organization",
    entityId: req.user.orgId,
    meta: { fields },
  });
  res.json(data);
}

async function getSettings(req, res) {
  const data = await service.getSettingsBundle(req.user.orgId);
  res.json(data);
}

module.exports = { getCurrent, patchSettings, getSettings };
