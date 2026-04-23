const router = require("express").Router();
const controller = require("./payments.controller");
const auth = require("../../middleware/auth");
const tenant = require("../../middleware/tenant");
const { permit } = require("../../middleware/rbac");
const validate = require("../../middleware/validate.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const { createPaymentSchema } = require("./payments.validation");

router.get("/", auth, tenant, permit("manage_payments"), asyncHandler(controller.getAll));
router.post(
  "/",
  auth,
  tenant,
  permit("manage_payments"),
  validate(createPaymentSchema),
  asyncHandler(controller.create)
);

module.exports = router;
