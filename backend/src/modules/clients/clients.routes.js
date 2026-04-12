const router = require("express").Router();
const controller = require("./clients.controller");
const auth = require("../../middleware/auth.middleware");
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

router.get("/", auth, asyncHandler(controller.getAll));

router.get(
  "/:id/detail",
  auth,
  validate(idParamSchema, "params"),
  asyncHandler(controller.getDetail)
);

router.get(
  "/:id/chart/files/:fileId",
  auth,
  validate(idFileParamSchema, "params"),
  asyncHandler(controller.getChartFile)
);

router.post(
  "/:id/chart",
  auth,
  validate(idParamSchema, "params"),
  validate(createChartEntrySchema),
  asyncHandler(controller.createChartEntry)
);

router.get("/:id", auth, asyncHandler(controller.getOne));

router.post(
  "/",
  auth,
  validate(createClientSchema),
  asyncHandler(controller.create)
);

router.patch(
  "/:id",
  auth,
  validate(updateClientSchema),
  asyncHandler(controller.update)
);

router.delete(
  "/:id",
  auth,
  requireDeletePermission,
  asyncHandler(controller.remove)
);

module.exports = router;
