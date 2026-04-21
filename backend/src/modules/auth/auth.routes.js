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
const {
  AUTH_WINDOW_MS,
  AUTH_LOGIN_MAX_FAILED,
  AUTH_OTHER_MAX,
} = require("../../config/rate-limits");

/** Register, forgot, reset — sprečava zloupotrebu bez mučenja uobičajenih korisnika. */
const authRouteLimit = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_OTHER_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "Previše pokušaja prijave ili registracije. Pokušajte ponovo za nekoliko minuta.",
  },
});

/** Neuspešne prijave / IP; uspeh ne troši kvotu. */
const loginRouteLimit = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_LOGIN_MAX_FAILED,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error:
      "Previše neuspešnih prijava sa ove adrese. Pokušajte ponovo za nekoliko minuta.",
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
