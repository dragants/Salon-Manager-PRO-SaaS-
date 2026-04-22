const router = require("express").Router();
const controller = require("./booking.controller");
const validateZod = require("../../middleware/validate-zod.middleware");
const { makePublicLimiter } = require("../../middleware/public-rate-limit.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const {
  publicSlugParamsSchema,
  publicCancelParamsSchema,
  slotsQuerySchema,
  bookBodySchema,
} = require("./booking.validation");
const {
  PUBLIC_READ_WINDOW_MS,
  PUBLIC_READ_MAX,
  PUBLIC_SLOTS_WINDOW_MS,
  PUBLIC_SLOTS_MAX,
  PUBLIC_BOOK_WINDOW_MS,
  PUBLIC_BOOK_MAX,
} = require("../../config/rate-limits");

// Public read: česte provere termina, ali i dalje sa granicom.
const publicReadLimit = makePublicLimiter({
  name: "public_read",
  windowMs: PUBLIC_READ_WINDOW_MS,
  max: PUBLIC_READ_MAX,
});

// Public slots: polling ume da bude agresivan (UI refresh) → strože.
const slotsReadLimit = makePublicLimiter({
  name: "public_slots",
  windowMs: PUBLIC_SLOTS_WINDOW_MS,
  max: PUBLIC_SLOTS_MAX,
});

// Public book: zaštita od spama (SMS/email) i brute-force.
const bookWriteLimit = makePublicLimiter({
  name: "public_book",
  windowMs: PUBLIC_BOOK_WINDOW_MS,
  max: PUBLIC_BOOK_MAX,
});

router.get(
  "/:slug/slots",
  slotsReadLimit,
  validateZod(publicSlugParamsSchema, "params"),
  validateZod(slotsQuerySchema, "query"),
  asyncHandler(controller.getSlots)
);
router.get(
  "/:slug",
  publicReadLimit,
  validateZod(publicSlugParamsSchema, "params"),
  asyncHandler(controller.getSalon)
);
router.post(
  "/:slug/book",
  bookWriteLimit,
  validateZod(publicSlugParamsSchema, "params"),
  validateZod(bookBodySchema, "body"),
  asyncHandler(controller.book)
);

router.post(
  "/:slug/cancel/:token",
  bookWriteLimit,
  validateZod(publicCancelParamsSchema, "params"),
  asyncHandler(controller.cancelByToken)
);

module.exports = router;
