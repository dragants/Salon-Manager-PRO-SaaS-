const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const controller = require("./auth.controller");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("./auth.validation");
const validate = require("../../middleware/validate.middleware");
const asyncHandler = require("../../utils/asyncHandler");

/** Stroži limit od globalnog (brute-force / credential stuffing). */
const authRouteLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "Previše pokušaja prijave ili registracije. Pokušajte ponovo za nekoliko minuta.",
  },
});

/** Brute-force: najviše 10 pokušaja prijave u minuti (po IP). */
const loginRouteLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error:
      "Previše neuspešnih prijava sa ove adrese. Pokušajte ponovo za minut.",
  },
});

router.post("/logout", asyncHandler(controller.logout));

router.post(
  "/register",
  authRouteLimit,
  validate(registerSchema),
  asyncHandler(controller.register)
);
router.post(
  "/login",
  loginRouteLimit,
  validate(loginSchema),
  asyncHandler(controller.login)
);

router.post(
  "/forgot-password",
  authRouteLimit,
  validate(forgotPasswordSchema),
  asyncHandler(controller.forgotPassword)
);

router.post(
  "/reset-password",
  authRouteLimit,
  validate(resetPasswordSchema),
  asyncHandler(controller.resetPassword)
);

module.exports = router;
