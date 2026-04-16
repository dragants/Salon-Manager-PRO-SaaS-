const router = require("express").Router();
const auth = require("../../middleware/auth.middleware");
const requireAdmin = require("../../middleware/admin.middleware");
const validate = require("../../middleware/validate.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const controller = require("./loyalty.controller");
const {
  idParamSchema,
  createProgramSchema,
  patchProgramSchema,
  eligibilityQuerySchema,
} = require("./loyalty.validation");

router.get(
  "/eligibility",
  auth,
  validate(eligibilityQuerySchema, "query"),
  asyncHandler(controller.eligibility)
);

router.get("/", auth, requireAdmin, asyncHandler(controller.list));

router.post(
  "/",
  auth,
  requireAdmin,
  validate(createProgramSchema),
  asyncHandler(controller.create)
);

router.patch(
  "/:id",
  auth,
  requireAdmin,
  validate(idParamSchema, "params"),
  validate(patchProgramSchema),
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
