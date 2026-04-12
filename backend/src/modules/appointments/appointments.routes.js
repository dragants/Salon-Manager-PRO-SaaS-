const router = require("express").Router();
const controller = require("./appointments.controller");
const streamController = require("./appointments.stream.controller");
const auth = require("../../middleware/auth.middleware");
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
  validate(listAppointmentsQuerySchema, "query"),
  asyncHandler(controller.getAll)
);
router.post(
  "/",
  auth,
  validate(createAppointmentSchema),
  asyncHandler(controller.create)
);
router.get(
  "/:id",
  auth,
  validate(idParamSchema, "params"),
  asyncHandler(controller.getById)
);
router.patch(
  "/:id",
  auth,
  validate(idParamSchema, "params"),
  validate(updateAppointmentSchema),
  asyncHandler(controller.update)
);
router.delete(
  "/:id",
  auth,
  requireDeletePermission,
  validate(idParamSchema, "params"),
  asyncHandler(controller.remove)
);

module.exports = router;
