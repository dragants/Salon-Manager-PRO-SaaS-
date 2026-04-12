const router = require("express").Router();
const auth = require("../../middleware/auth.middleware");
const requireAdmin = require("../../middleware/admin.middleware");
const validate = require("../../middleware/validate.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const {
  listShiftsQuerySchema,
  replaceShiftsQuerySchema,
  replaceShiftsBodySchema,
} = require("./shifts.validation");
const controller = require("./shifts.controller");

router.get(
  "/",
  auth,
  requireAdmin,
  validate(listShiftsQuerySchema, "query"),
  asyncHandler(controller.list)
);

router.put(
  "/",
  auth,
  requireAdmin,
  validate(replaceShiftsQuerySchema, "query"),
  validate(replaceShiftsBodySchema),
  asyncHandler(controller.replace)
);

module.exports = router;
