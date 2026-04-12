const router = require("express").Router();
const auth = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const { getAvailabilityQuerySchema } = require("./availability.validation");
const controller = require("./availability.controller");

router.get(
  "/",
  auth,
  validate(getAvailabilityQuerySchema, "query"),
  asyncHandler(controller.getAvailability)
);

module.exports = router;
