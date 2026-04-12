const service = require("./clients.service");

async function getAll(req, res) {
  const data = await service.getAll(req.user.orgId);
  res.json(data);
}

async function getOne(req, res) {
  const data = await service.getOne(req.params.id, req.user.orgId);
  if (!data) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json(data);
}

async function getDetail(req, res) {
  const data = await service.getDetail(req.params.id, req.user.orgId);
  if (!data) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json(data);
}

async function createChartEntry(req, res) {
  const entry = await service.addChartEntry(
    req.params.id,
    req.user.orgId,
    req.body
  );
  res.status(201).json(entry);
}

async function getChartFile(req, res) {
  const clientId = Number(req.params.id);
  const fileId = Number(req.params.fileId);
  const ok = await service.assertChartFileBelongsToClient(
    fileId,
    clientId,
    req.user.orgId
  );
  if (!ok) {
    return res.status(404).json({ error: "Not found" });
  }
  const payload = await service.getChartFilePayload(fileId, req.user.orgId);
  if (!payload) {
    return res.status(404).json({ error: "Not found" });
  }
  const name = payload.original_name || "attachment";
  res.setHeader("Content-Type", payload.mime_type || "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename*=UTF-8''${encodeURIComponent(name)}`
  );
  res.send(payload.data);
}

async function create(req, res) {
  const data = await service.create(req.body, req.user.orgId);
  res.json(data);
}

async function update(req, res) {
  const data = await service.update(req.params.id, req.body, req.user.orgId);
  res.json(data);
}

async function remove(req, res) {
  await service.remove(req.params.id, req.user.orgId, req.user.userId);
  res.json({ success: true });
}

module.exports = {
  getAll,
  getOne,
  getDetail,
  createChartEntry,
  getChartFile,
  create,
  update,
  remove,
};
