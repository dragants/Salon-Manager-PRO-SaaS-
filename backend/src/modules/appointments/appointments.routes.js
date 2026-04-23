const router = require("express").Router();
const controller = require("./appointments.controller");
const streamController = require("./appointments.stream.controller");
const auth = require("../../middleware/auth");
const tenant = require("../../middleware/tenant");
const { permit } = require("../../middleware/rbac");
const onlyOwn = require("../../middleware/onlyOwn");
const { notificationsProtection } = require("../../middleware/notificationsProtection");
const sseAuth = require("../../middleware/sseAuth.middleware");
const requireDeletePermission = require("../../middleware/worker-delete.middleware");
const validate = require("../../middleware/validate.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const {
  idParamSchema,
  listAppointmentsQuerySchema,
  createAppointmentSchema,
  updateAppointmentSchema,
} = require("./appointments.validation");

router.get("/stream", sseAuth, streamController.stream);

router.get(
  "/",
  auth,
  tenant,
  (req, _res, next) => {
    // Staff can only view their own appointments; admins/receptionists can see all.
    if (req.user?.role === "staff") {
      return onlyOwn(req, _res, next);
    }
    next();
  },
  (req, res, next) => {
    // Accept either manage_appointments OR view_own_appointments (for staff)
    if (req.user?.role === "staff") {
      return permit("view_own_appointments")(req, res, next);
    }
    return permit("manage_appointments")(req, res, next);
  },
  validate(listAppointmentsQuerySchema, "query"),
  asyncHandler(controller.getAll)
);
router.post(
  "/",
  auth,
  tenant,
  permit("manage_appointments"),
  notificationsProtection,
  validate(createAppointmentSchema),
  asyncHandler(controller.create)
);
router.get(
  "/:id",
  auth,
  tenant,
  (req, res, next) => {
    if (req.user?.role === "staff") {
      return permit("view_own_appointments")(req, res, next);
    }
    return permit("manage_appointments")(req, res, next);
  },
  validate(idParamSchema, "params"),
  asyncHandler(controller.getById)
);
router.patch(
  "/:id",
  auth,
  tenant,
  (req, res, next) => {
    if (req.user?.role === "staff") {
      return permit("update_own_appointments")(req, res, next);
    }
    return permit("manage_appointments")(req, res, next);
  },
  validate(idParamSchema, "params"),
  validate(updateAppointmentSchema),
  asyncHandler(controller.update)
);
router.delete(
  "/:id",
  auth,
  tenant,
  permit("manage_appointments"),
  requireDeletePermission,
  validate(idParamSchema, "params"),
  asyncHandler(controller.remove)
);

module.exports = router;
