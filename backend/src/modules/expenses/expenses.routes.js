const router = require("express").Router();
const auth = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const controller = require("./expenses.controller");
const {
  listQuerySchema,
  monthlyTotalsQuerySchema,
  createExpenseSchema,
  updateExpenseSchema,
  idParamSchema,
} = require("./expenses.validation");

router.get(
  "/monthly-totals",
  auth,
  validate(monthlyTotalsQuerySchema, "query"),
  asyncHandler(controller.monthlyTotals)
);

router.get(
  "/",
  auth,
  validate(listQuerySchema, "query"),
  asyncHandler(controller.list)
);

router.post(
  "/",
  auth,
  validate(createExpenseSchema),
  asyncHandler(controller.create)
);

router.get(
  "/:id",
  auth,
  validate(idParamSchema, "params"),
  asyncHandler(controller.getOne)
);

router.patch(
  "/:id",
  auth,
  validate(idParamSchema, "params"),
  validate(updateExpenseSchema),
  asyncHandler(controller.update)
);

router.delete(
  "/:id",
  auth,
  validate(idParamSchema, "params"),
  asyncHandler(controller.remove)
);

module.exports = router;
