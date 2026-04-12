const router = require("express").Router();
const controller = require("./analytics.controller");
const auth = require("../../middleware/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");

router.get("/", auth, asyncHandler(controller.getAnalytics));

module.exports = router;
