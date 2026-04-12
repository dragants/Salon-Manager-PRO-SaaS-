const router = require("express").Router();
const controller = require("./audit.controller");
const auth = require("../../middleware/auth.middleware");
const requireAdmin = require("../../middleware/admin.middleware");
const validate = require("../../middleware/validate.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const { listAuditQuerySchema } = require("./audit.validation");

router.get(
  "/",
  auth,
  requireAdmin,
  validate(listAuditQuerySchema, "query"),
  asyncHandler(controller.list)
);

module.exports = router;
