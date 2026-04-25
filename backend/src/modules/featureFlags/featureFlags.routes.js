const router = require("express").Router();
const auth = require("../../middleware/auth");
const tenant = require("../../middleware/tenant");
const features = require("../../middleware/features");
const { permit } = require("../../middleware/rbac");
const asyncHandler = require("../../utils/asyncHandler");
const service = require("./featureFlags.service");

router.get(
  "/catalog",
  auth,
  tenant,
  permit("manage_users"),
  asyncHandler(async (_req, res) => {
    const data = await service.getCatalog();
    res.json({ data });
  })
);

router.get(
  "/me",
  auth,
  tenant,
  features,
  permit("manage_users"),
  asyncHandler(async (req, res) => {
    const flags = await service.getFlagsForTenant(req.tenantId);
    res.json({ tenantId: req.tenantId, flags });
  })
);

router.patch(
  "/me",
  auth,
  tenant,
  features,
  permit("manage_users"),
  asyncHandler(async (req, res) => {
    const flags = req.body?.flags;
    const next = await service.setTenantFlags(req.tenantId, flags);
    res.json({ tenantId: req.tenantId, flags: next });
  })
);

module.exports = router;

