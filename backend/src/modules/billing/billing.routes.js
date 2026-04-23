const router = require("express").Router();
const auth = require("../../middleware/auth");
const tenant = require("../../middleware/tenant");
const { permit } = require("../../middleware/rbac");
const asyncHandler = require("../../utils/asyncHandler");
const controller = require("./billing.controller");

router.get("/status", auth, tenant, asyncHandler(controller.status));
router.post("/checkout", auth, tenant, permit("manage_users"), asyncHandler(controller.checkout));
router.post(
  "/stripe/checkout",
  auth,
  tenant,
  permit("manage_users"),
  asyncHandler(controller.stripeCheckout)
);
router.post(
  "/stripe/portal",
  auth,
  tenant,
  permit("manage_users"),
  asyncHandler(controller.stripePortal)
);
router.post("/portal", auth, tenant, permit("manage_users"), asyncHandler(controller.portal));

module.exports = router;
