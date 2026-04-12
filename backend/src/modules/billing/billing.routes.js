const router = require("express").Router();
const auth = require("../../middleware/auth.middleware");
const requireAdmin = require("../../middleware/admin.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const controller = require("./billing.controller");

router.get("/status", auth, asyncHandler(controller.status));
router.post("/checkout", auth, requireAdmin, asyncHandler(controller.checkout));
router.post("/portal", auth, requireAdmin, asyncHandler(controller.portal));

module.exports = router;
