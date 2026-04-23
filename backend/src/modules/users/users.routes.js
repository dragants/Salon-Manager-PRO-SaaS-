const router = require("express").Router();
const controller = require("./users.controller");
const auth = require("../../middleware/auth");
const tenant = require("../../middleware/tenant");
const { permit } = require("../../middleware/rbac");
const validate = require("../../middleware/validate.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const {
  createTeamMemberSchema,
  patchTeamMemberSchema,
  changePasswordSchema,
  pushSubscriptionSchema,
  pushUnsubscribeSchema,
} = require("./users.validation");

router.get("/me/push-config", auth, tenant, asyncHandler(controller.getPushConfig));
router.post(
  "/me/push-subscription",
  auth,
  tenant,
  validate(pushSubscriptionSchema),
  asyncHandler(controller.pushSubscribe)
);
router.post(
  "/me/push-unsubscribe",
  auth,
  tenant,
  validate(pushUnsubscribeSchema),
  asyncHandler(controller.pushUnsubscribe)
);
router.post("/me/push-test", auth, tenant, asyncHandler(controller.pushTest));

router.get("/me", auth, tenant, asyncHandler(controller.getMe));

router.patch(
  "/me/password",
  auth,
  tenant,
  validate(changePasswordSchema),
  asyncHandler(controller.changePassword)
);

router.post(
  "/",
  auth,
  tenant,
  permit("manage_users"),
  validate(createTeamMemberSchema),
  asyncHandler(controller.create)
);

router.get("/", auth, tenant, permit("manage_users"), asyncHandler(controller.listTeam));

router.get("/:id", auth, tenant, permit("manage_users"), asyncHandler(controller.getTeamMember));

router.patch(
  "/:id",
  auth,
  tenant,
  permit("manage_users"),
  validate(patchTeamMemberSchema),
  asyncHandler(controller.updateTeamMember)
);

router.delete(
  "/:id",
  auth,
  tenant,
  permit("manage_users"),
  asyncHandler(controller.removeTeamMember)
);

module.exports = router;
