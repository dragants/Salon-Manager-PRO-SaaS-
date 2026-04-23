const router = require("express").Router();
const controller = require("./services.controller");
const auth = require("../../middleware/auth");
const tenant = require("../../middleware/tenant");
const { permit } = require("../../middleware/rbac");
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
router.get(
  "/categories",
  auth,
  tenant,
  permit("view_services"),
  asyncHandler(controller.getCategories)
);
router.post(
  "/categories",
  auth,
  tenant,
  permit("manage_services"),
  validate(createCategorySchema),
  asyncHandler(controller.createCategory)
);
router.patch(
  "/categories/:id",
  auth,
  tenant,
  permit("manage_services"),
  validate(idParamSchema, "params"),
  validate(updateCategorySchema),
  asyncHandler(controller.updateCategory)
);
router.delete(
  "/categories/:id",
  auth,
  tenant,
  permit("manage_services"),
  validate(idParamSchema, "params"),
  asyncHandler(controller.removeCategory)
);

/* ── Services ── */
router.get("/", auth, tenant, permit("view_services"), asyncHandler(controller.getAll));
router.post(
  "/",
  auth,
  tenant,
  permit("manage_services"),
  validate(createServiceSchema),
  asyncHandler(controller.create)
);
router.get(
  "/:id",
  auth,
  tenant,
  permit("view_services"),
  validate(idParamSchema, "params"),
  asyncHandler(controller.getById)
);
router.patch(
  "/:id",
  auth,
  tenant,
  permit("manage_services"),
  validate(idParamSchema, "params"),
  validate(updateServiceSchema),
  asyncHandler(controller.update)
);
router.delete(
  "/:id",
  auth,
  tenant,
  permit("manage_services"),
  validate(idParamSchema, "params"),
  asyncHandler(controller.remove)
);

module.exports = router;
