const usersService = require("../modules/users/users.service");
const asyncHandler = require("../utils/asyncHandler");

async function requireAdmin(req, res, next) {
  const user = await usersService.getById(req.user.userId);
  if (user.role !== "admin") {
    return res.status(403).json({
      error: "Samo administrator salona može ovo uraditi.",
    });
  }
  next();
}

module.exports = asyncHandler(requireAdmin);
