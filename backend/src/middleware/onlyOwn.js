/**
 * Adds an ownership filter to the request (used for staff restrictions).
 * Convention: downstream controllers/services may read req.onlyOwnStaffUserId.
 */

module.exports = function onlyOwnStaffAppointments(req, _res, next) {
  req.onlyOwnStaffUserId = req.user?.id ?? req.user?.userId ?? null;
  next();
};

