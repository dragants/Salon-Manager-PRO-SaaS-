const requirePermission = require("./requirePermission.middleware");
const { PERM } = require("../security/permissions");

// Backwards-compatible name: "admin" == has org settings write permissions.
module.exports = requirePermission(PERM.ORG_SETTINGS_WRITE);
