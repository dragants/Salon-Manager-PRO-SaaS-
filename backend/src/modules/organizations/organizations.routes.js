const router = require("express").Router();
const controller = require("./organizations.controller");
const auth = require("../../middleware/auth");
const tenant = require("../../middleware/tenant");
const { permit } = require("../../middleware/rbac");
const validate = require("../../middleware/validate.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const {
  patchOrganizationSettingsSchema,
} = require("./organizations.validation");

router.get("/me", auth, tenant, asyncHandler(controller.getCurrent));
router.get("/me/settings", auth, tenant, asyncHandler(controller.getSettings));
router.patch(
  "/me/settings",
  auth,
  tenant,
  permit("manage_users"),
  validate(patchOrganizationSettingsSchema),
  asyncHandler(controller.patchSettings)
);

module.exports = router;
