const { ZodError } = require("zod");

/**
 * Generički Zod validation middleware.
 * Za Joi šeme koristi `validate.middleware.js`.
 *
 * @param {import("zod").ZodType} schema
 * @param {"body" | "query" | "params"} [source="body"]
 */
const validate = (schema, source = "body") => {
  return (req, res, next) => {
    try {
      // 💥 Spreči manualni tenant injection
      if (req.body && typeof req.body === "object") delete req.body.tenantId;
      if (req.query && typeof req.query === "object") delete req.query.tenantId;

      const data = req[source];
      const parsed = schema.parse(data);

      req[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: err.issues.map((e) => ({
            field: e.path.length ? e.path.join(".") : "(root)",
            message: e.message,
          })),
        });
      }
      return next(err);
    }
  };
};

module.exports = validate;
