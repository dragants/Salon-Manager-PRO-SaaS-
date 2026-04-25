const router = require("express").Router();
const controller = require("./payments.controller");
const auth = require("../../middleware/auth");
const tenant = require("../../middleware/tenant");
const { permit } = require("../../middleware/rbac");
const validate = require("../../middleware/validate");
const asyncHandler = require("../../utils/asyncHandler");
const { createPaymentSchema } = require("./payments.validation");
const { refundSchema, paymentQuerySchema } = require("../../validators/payments");

router.get(
  "/",
  auth,
  tenant,
  permit("manage_payments"),
  validate(paymentQuerySchema, "query"),
  asyncHandler(controller.getAll)
);
router.post(
  "/",
  auth,
  tenant,
  permit("manage_payments"),
  validate(createPaymentSchema),
  asyncHandler(controller.create)
);

router.post(
  "/refund",
  auth,
  tenant,
  permit("manage_payments"),
  validate(refundSchema),
  asyncHandler(controller.refund)
);

module.exports = router;
