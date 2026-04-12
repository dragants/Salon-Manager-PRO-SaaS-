const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const controller = require("./booking.controller");
const validate = require("../../middleware/validate.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const { slotsQuerySchema, bookBodySchema } = require("./booking.validation");

const publicReadLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

const bookWriteLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get(
  "/:slug/slots",
  publicReadLimit,
  validate(slotsQuerySchema, "query"),
  asyncHandler(controller.getSlots)
);
router.get("/:slug", publicReadLimit, asyncHandler(controller.getSalon));
router.post(
  "/:slug/book",
  bookWriteLimit,
  validate(bookBodySchema),
  asyncHandler(controller.book)
);

module.exports = router;
