const router = require("express").Router();
const controller = require("./audit.controller");
const auth = require("../../middleware/auth");
const tenant = require("../../middleware/tenant");
const { permit } = require("../../middleware/rbac");
const validate = require("../../middleware/validate.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const { listAuditQuerySchema } = require("./audit.validation");

router.get(
  "/",
  auth,
  tenant,
  permit("view_reports"),
  validate(listAuditQuerySchema, "query"),
  asyncHandler(controller.list)
);

module.exports = router;
