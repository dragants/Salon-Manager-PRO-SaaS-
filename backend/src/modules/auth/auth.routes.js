const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const controller = require("./auth.controller");
const { loginProtection } = require("../../middleware/loginProtection");
const { redisStoreOrNull } = require("../../middleware/rateLimitRedisStore");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  enable2faSchema,
  verify2faSchema,
} = require("./auth.validation");
const auth = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const {
  AUTH_WINDOW_MS,
  AUTH_LOGIN_MAX_FAILED,
  AUTH_OTHER_MAX,
} = require("../../config/rate-limits");

/** Register, forgot, reset — sprečava zloupotrebu bez mučenja uobičajenih korisnika. */
const authOtherStore = redisStoreOrNull("auth:other");
const authRouteLimit = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_OTHER_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  ...(authOtherStore ? { store: authOtherStore } : {}),
  message: {
    error:
      "Previše pokušaja prijave ili registracije. Pokušajte ponovo za nekoliko minuta.",
  },
});

/** Neuspešne prijave / IP; uspeh ne troši kvotu. */
const authLoginStore = redisStoreOrNull("auth:login");
const loginRouteLimit = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  max: AUTH_LOGIN_MAX_FAILED,
  standardHeaders: true,
  legacyHeaders: false,
  ...(authLoginStore ? { store: authLoginStore } : {}),
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
  loginProtection,
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

// 2FA (TOTP)
router.post("/2fa/setup", auth, asyncHandler(controller.begin2faSetup));
router.post(
  "/2fa/enable",
  auth,
  validate(enable2faSchema),
  asyncHandler(controller.enable2fa)
);
router.post(
  "/2fa/verify",
  auth,
  validate(verify2faSchema),
  asyncHandler(controller.verify2fa)
);

module.exports = router;
