const { hasPermission } = require("../security/permissions");

module.exports = function requirePermission(permission) {
  return function (req, res, next) {
    const role = req.user?.role;
    if (!role) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!hasPermission(role, permission)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};

