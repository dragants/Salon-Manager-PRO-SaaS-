const router = require("express").Router();
const controller = require("./organizations.controller");
const auth = require("../../middleware/auth.middleware");
const requireAdmin = require("../../middleware/admin.middleware");
const validate = require("../../middleware/validate.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const {
  patchOrganizationSettingsSchema,
} = require("./organizations.validation");

router.get("/me", auth, asyncHandler(controller.getCurrent));
router.get("/me/settings", auth, asyncHandler(controller.getSettings));
router.patch(
  "/me/settings",
  auth,
  requireAdmin,
  validate(patchOrganizationSettingsSchema),
  asyncHandler(controller.patchSettings)
);

module.exports = router;
