const router = require("express").Router();
const controller = require("./services.controller");
const auth = require("../../middleware/auth.middleware");
const requireAdmin = require("../../middleware/admin.middleware");
const validate = require("../../middleware/validate.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const {
  idParamSchema,
  createServiceSchema,
  updateServiceSchema,
  createCategorySchema,
  updateCategorySchema,
} = require("./services.validation");

/* ── Categories (before /:id to avoid path clash) ── */
router.get("/categories", auth, asyncHandler(controller.getCategories));
router.post(
  "/categories",
  auth,
  requireAdmin,
  validate(createCategorySchema),
  asyncHandler(controller.createCategory)
);
router.patch(
  "/categories/:id",
  auth,
  requireAdmin,
  validate(idParamSchema, "params"),
  validate(updateCategorySchema),
  asyncHandler(controller.updateCategory)
);
router.delete(
  "/categories/:id",
  auth,
  requireAdmin,
  validate(idParamSchema, "params"),
  asyncHandler(controller.removeCategory)
);

/* ── Services ── */
router.get("/", auth, asyncHandler(controller.getAll));
router.post(
  "/",
  auth,
  requireAdmin,
  validate(createServiceSchema),
  asyncHandler(controller.create)
);
router.get(
  "/:id",
  auth,
  validate(idParamSchema, "params"),
  asyncHandler(controller.getById)
);
router.patch(
  "/:id",
  auth,
  requireAdmin,
  validate(idParamSchema, "params"),
  validate(updateServiceSchema),
  asyncHandler(controller.update)
);
router.delete(
  "/:id",
  auth,
  requireAdmin,
  validate(idParamSchema, "params"),
  asyncHandler(controller.remove)
);

module.exports = router;
