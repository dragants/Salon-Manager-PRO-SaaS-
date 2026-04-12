const usersService = require("../modules/users/users.service");
const orgService = require("../modules/organizations/organizations.service");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Za ulogu worker: dozvoli DELETE samo ako je admin uključio worker_permissions.can_delete.
 * Administrator uvek sme.
 */
async function requireDeletePermission(req, res, next) {
  const user = await usersService.getById(req.user.userId);
  if (user.role === "admin") {
    return next();
  }
  if (user.role !== "worker") {
    return next();
  }
  const allowed = await orgService.getWorkerCanDelete(req.user.orgId);
  if (!allowed) {
    return res.status(403).json({
      error:
        "Brisanje nije dozvoljeno za ovaj nalog. Obrati se administratoru salona.",
    });
  }
  next();
}

module.exports = asyncHandler(requireDeletePermission);
