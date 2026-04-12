const router = require("express").Router();
const controller = require("./dashboard.controller");
const auth = require("../../middleware/auth.middleware");
const asyncHandler = require("../../utils/asyncHandler");

router.get("/", auth, asyncHandler(controller.getSummary));

module.exports = router;
