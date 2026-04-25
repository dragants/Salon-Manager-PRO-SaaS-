const router = require("express").Router();
const controller = require("./clients.controller");
const auth = require("../../middleware/auth");
const tenant = require("../../middleware/tenant");
const { permit } = require("../../middleware/rbac");
const requireDeletePermission = require("../../middleware/worker-delete.middleware");
const validate = require("../../middleware/validate.middleware");
const asyncHandler = require("../../utils/asyncHandler");

const {
  createClientSchema,
  updateClientSchema,
  idParamSchema,
  idFileParamSchema,
  createChartEntrySchema,
} = require("./clients.validation");

router.get(
  "/",
  auth,
  tenant,
  permit("manage_clients"),
  asyncHandler(controller.getAll)
);

router.get(
  "/:id/detail",
  auth,
  tenant,
  permit("manage_clients"),
  validate(idParamSchema, "params"),
  asyncHandler(controller.getDetail)
);

router.get(
  "/:id/chart/files/:fileId",
  auth,
  tenant,
  permit("manage_clients"),
  validate(idFileParamSchema, "params"),
  asyncHandler(controller.getChartFile)
);

router.post(
  "/:id/chart",
  auth,
  tenant,
  permit("manage_clients"),
  validate(idParamSchema, "params"),
  validate(createChartEntrySchema),
  asyncHandler(controller.createChartEntry)
);

router.get("/:id", auth, tenant, permit("manage_clients"), validate(idParamSchema, "params"), asyncHandler(controller.getOne));

router.post(
  "/",
  auth,
  tenant,
  permit("manage_clients"),
  validate(createClientSchema),
  asyncHandler(controller.create)
);

router.patch(
  "/:id",
  auth,
  tenant,
  permit("manage_clients"),
  validate(idParamSchema, "params"),
  validate(updateClientSchema),
  asyncHandler(controller.update)
);

router.delete(
  "/:id",
  auth,
  tenant,
  permit("manage_clients"),
  requireDeletePermission,
  validate(idParamSchema, "params"),
  asyncHandler(controller.remove)
);

module.exports = router;
