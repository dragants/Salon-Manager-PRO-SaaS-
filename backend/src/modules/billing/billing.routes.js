const router = require("express").Router();
const auth = require("../../middleware/auth");
const tenant = require("../../middleware/tenant");
const { permit } = require("../../middleware/rbac");
const validate = require("../../middleware/validate");
const asyncHandler = require("../../utils/asyncHandler");
const controller = require("./billing.controller");
const { billingPostSchema, billingSchema } = require("../../validators/billing");

router.get("/status", auth, tenant, asyncHandler(controller.status));
router.post(
  "/subscribe",
  auth,
  tenant,
  permit("manage_users"),
  validate(billingSchema),
  asyncHandler(controller.subscribe)
);

router.post(
  "/checkout",
  auth,
  tenant,
  permit("manage_users"),
  validate(billingPostSchema),
  asyncHandler(controller.checkout)
);
router.post(
  "/stripe/checkout",
  auth,
  tenant,
  permit("manage_users"),
  validate(billingPostSchema),
  asyncHandler(controller.stripeCheckout)
);
router.post(
  "/stripe/portal",
  auth,
  tenant,
  permit("manage_users"),
  validate(billingPostSchema),
  asyncHandler(controller.stripePortal)
);
router.post(
  "/portal",
  auth,
  tenant,
  permit("manage_users"),
  validate(billingPostSchema),
  asyncHandler(controller.portal)
);

module.exports = router;
