const service = require("./dashboard.service");
const usersService = require("../users/users.service");

async function getSummary(req, res) {
  const user = await usersService.getById(req.user.userId);
  const isAdmin = user.role === "admin";
  const data = await service.getSummary(req.user.orgId, isAdmin);
  res.json(data);
}

module.exports = { getSummary };
