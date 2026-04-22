const router = require("express").Router();
const auth = require("../../middleware/auth.middleware");
const requireAdmin = require("../../middleware/admin.middleware");
const validate = require("../../middleware/validate.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const controller = require("./supplies.controller");
const {
  idParamSchema,
  createItemSchema,
  patchItemSchema,
  movementsQuerySchema,
  createMovementSchema,
  serviceUsageParamsSchema,
  setServiceUsageSchema,
  removeServiceUsageSchema,
} = require("./supplies.validation");

/* ── Service-Supply usage mapping ── */
router.get(
  "/service-usage/:serviceId",
  auth,
  requireAdmin,
  validate(serviceUsageParamsSchema, "params"),
  asyncHandler(controller.getServiceUsage)
);

router.put(
  "/service-usage/:serviceId",
  auth,
  requireAdmin,
  validate(serviceUsageParamsSchema, "params"),
  validate(setServiceUsageSchema),
  asyncHandler(controller.setServiceUsage)
);

router.delete(
  "/service-usage/:serviceId",
  auth,
  requireAdmin,
  validate(serviceUsageParamsSchema, "params"),
  validate(removeServiceUsageSchema),
  asyncHandler(controller.removeServiceUsage)
);

/* ── Movements ── */
  "/movements",
  auth,
  requireAdmin,
  validate(movementsQuerySchema, "query"),
  asyncHandler(controller.listMovements)
);

router.post(
  "/movements",
  auth,
  requireAdmin,
  validate(createMovementSchema),
  asyncHandler(controller.createMovement)
);

router.get("/", auth, requireAdmin, asyncHandler(controller.list));

router.post(
  "/",
  auth,
  requireAdmin,
  validate(createItemSchema),
  asyncHandler(controller.create)
);

router.get(
  "/:id",
  auth,
  requireAdmin,
  validate(idParamSchema, "params"),
  asyncHandler(controller.getOne)
);

router.patch(
  "/:id",
  auth,
  requireAdmin,
  validate(idParamSchema, "params"),
  validate(patchItemSchema),
  asyncHandler(controller.update)
);

router.delete(
  "/:id",
  auth,
  requireAdmin,
  validate(idParamSchema, "params"),
  asyncHandler(controller.remove)
);

module.exports = router;
