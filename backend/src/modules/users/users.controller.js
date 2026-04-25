const service = require("./users.service");
const auditService = require("../audit/audit.service");
const pushService = require("../../services/push.service");

function parseUserIdParam(req) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id) || id < 1) {
    return null;
  }
  return id;
}

async function getMe(req, res) {
  const data = await service.getById(req.user.userId);
  res.json({
    id: data.id,
    email: data.email,
    organization_id: data.organization_id,
    role: data.role,
    display_name: data.display_name ?? null,
    twofa_enabled: Boolean(data.twofa_enabled),
    mfa_enforced: Boolean(data.mfa_enforced),
  });
}

async function listTeam(req, res) {
  const rows = await service.listByOrganization(req.user.orgId);
  res.json(rows);
}

async function getTeamMember(req, res) {
  const id = parseUserIdParam(req);
  if (id == null) {
    return res.status(400).json({ error: "Neispravan ID." });
  }
  const row = await service.getTeamMember(req.user.orgId, id);
  res.json(service.mapTeamRow(row));
}

async function create(req, res) {
  const row = await service.createInOrganization(req.user.orgId, req.body);
  await auditService.insertRow({
    organizationId: req.user.orgId,
    userId: req.user.userId,
    action: "team_member_create",
    entityType: "user",
    entityId: row.id,
    meta: { email: row.email, role: row.role },
  });
  res.status(201).json(row);
}

async function updateTeamMember(req, res) {
  const id = parseUserIdParam(req);
  if (id == null) {
    return res.status(400).json({ error: "Neispravan ID." });
  }
  const row = await service.updateTeamMember(req.user.orgId, id, req.body);
  await auditService.insertRow({
    organizationId: req.user.orgId,
    userId: req.user.userId,
    action: "team_member_update",
    entityType: "user",
    entityId: id,
    meta: { fields: Object.keys(req.body) },
  });
  res.json(row);
}

async function removeTeamMember(req, res) {
  const id = parseUserIdParam(req);
  if (id == null) {
    return res.status(400).json({ error: "Neispravan ID." });
  }
  await service.removeTeamMember(req.user.userId, req.user.orgId, id);
  await auditService.insertRow({
    organizationId: req.user.orgId,
    userId: req.user.userId,
    action: "team_member_delete",
    entityType: "user",
    entityId: id,
    meta: {},
  });
  res.status(204).send();
}

async function changePassword(req, res) {
  const { current_password, new_password } = req.body;
  await service.changePassword(req.user.userId, current_password, new_password);
  res.json({ ok: true });
}

async function getPushConfig(req, res) {
  res.json({
    vapid_public_key: pushService.getPublicKey(),
  });
}

async function pushSubscribe(req, res) {
  const ua = req.headers["user-agent"] || null;
  await pushService.saveSubscription(
    req.user.userId,
    req.user.orgId,
    req.body,
    ua
  );
  res.status(201).json({ ok: true });
}

async function pushUnsubscribe(req, res) {
  const ep = req.body?.endpoint;
  await pushService.removeSubscription(req.user.userId, ep);
  res.json({ ok: true });
}

async function pushTest(req, res) {
  const out = await pushService.sendToUser(req.user.userId, {
    title: "Salon Manager PRO",
    body: "Push notifikacije rade na ovom uređaju.",
    url: "/dashboard",
  });
  res.json(out);
}

module.exports = {
  getMe,
  getPushConfig,
  pushSubscribe,
  pushUnsubscribe,
  pushTest,
  listTeam,
  getTeamMember,
  create,
  updateTeamMember,
  removeTeamMember,
  changePassword,
};
