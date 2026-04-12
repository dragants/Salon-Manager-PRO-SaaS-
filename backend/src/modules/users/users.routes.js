const router = require("express").Router();
const controller = require("./users.controller");
const auth = require("../../middleware/auth.middleware");
const requireAdmin = require("../../middleware/admin.middleware");
const validate = require("../../middleware/validate.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const {
  createTeamMemberSchema,
  patchTeamMemberSchema,
  changePasswordSchema,
  pushSubscriptionSchema,
  pushUnsubscribeSchema,
} = require("./users.validation");

router.get("/me/push-config", auth, asyncHandler(controller.getPushConfig));
router.post(
  "/me/push-subscription",
  auth,
  validate(pushSubscriptionSchema),
  asyncHandler(controller.pushSubscribe)
);
router.post(
  "/me/push-unsubscribe",
  auth,
  validate(pushUnsubscribeSchema),
  asyncHandler(controller.pushUnsubscribe)
);
router.post("/me/push-test", auth, asyncHandler(controller.pushTest));

router.get("/me", auth, asyncHandler(controller.getMe));

router.patch(
  "/me/password",
  auth,
  validate(changePasswordSchema),
  asyncHandler(controller.changePassword)
);

router.post(
  "/",
  auth,
  requireAdmin,
  validate(createTeamMemberSchema),
  asyncHandler(controller.create)
);

router.get("/", auth, asyncHandler(controller.listTeam));

router.get("/:id", auth, requireAdmin, asyncHandler(controller.getTeamMember));

router.patch(
  "/:id",
  auth,
  requireAdmin,
  validate(patchTeamMemberSchema),
  asyncHandler(controller.updateTeamMember)
);

router.delete(
  "/:id",
  auth,
  requireAdmin,
  asyncHandler(controller.removeTeamMember)
);

module.exports = router;
