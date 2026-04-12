const router = require("express").Router();
const controller = require("./payments.controller");
const auth = require("../../middleware/auth.middleware");
const requireAdmin = require("../../middleware/admin.middleware");
const validate = require("../../middleware/validate.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const { createPaymentSchema } = require("./payments.validation");

router.get("/", auth, requireAdmin, asyncHandler(controller.getAll));
router.post(
  "/",
  auth,
  requireAdmin,
  validate(createPaymentSchema),
  asyncHandler(controller.create)
);

module.exports = router;
