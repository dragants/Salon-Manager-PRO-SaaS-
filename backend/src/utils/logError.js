/**
 * Structured error log (safe for SaaS).
 * Keeps tenant/user context without dumping full request bodies.
 */
module.exports = function logError(err, req) {
  try {
    const tenantId =
      req.user?.orgId ?? req.tenantId ?? req.tenant?.id ?? req.organizationId;
    const userId = req.user?.userId ?? req.user?.id;
    const payload = {
      level: "error",
      message: err?.message || "Unknown error",
      code: err?.code,
      statusCode: err?.statusCode ?? err?.status,
      tenantId: tenantId ?? null,
      userId: userId ?? null,
      method: req?.method,
      path: req?.path,
      timestamp: new Date().toISOString(),
    };
    console.error(JSON.stringify(payload));
  } catch {
    console.error(err);
  }
};

