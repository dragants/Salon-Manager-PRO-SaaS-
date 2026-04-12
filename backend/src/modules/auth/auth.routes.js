const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const controller = require("./auth.controller");
const { registerSchema, loginSchema } = require("./auth.validation");
const validate = require("../../middleware/validate.middleware");
const asyncHandler = require("../../utils/asyncHandler");

/** Stroži limit od globalnog (brute-force / credential stuffing). */
const authRouteLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "Previše pokušaja prijave ili registracije. Pokušajte ponovo za nekoliko minuta.",
  },
});

router.post(
  "/register",
  authRouteLimit,
  validate(registerSchema),
  asyncHandler(controller.register)
);
router.post(
  "/login",
  authRouteLimit,
  validate(loginSchema),
  asyncHandler(controller.login)
);

module.exports = router;
