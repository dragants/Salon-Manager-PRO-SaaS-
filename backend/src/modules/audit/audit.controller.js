const service = require("./audit.service");

async function list(req, res) {
  const q = req.validatedQuery || {};
  const rows = await service.listForOrg(req.user.orgId, {
    limit: q.limit,
    action: q.action,
  });
  res.json(rows);
}

module.exports = { list };
