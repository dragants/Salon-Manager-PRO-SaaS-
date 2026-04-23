const { hasPermission } = require("../utils/permissions");

function permit(permission) {
  return (req, res, next) => {
    const role = req.user?.role;

    if (!hasPermission(role, permission)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Missing permission: ${permission}`,
      });
    }

    next();
  };
}

module.exports = { permit };

