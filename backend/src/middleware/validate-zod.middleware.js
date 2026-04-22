/**
 * Express middleware: validacija sa Zod šemom.
 * Na grešku vraća 400 sa strukturiranim telom (error + issues).
 *
 * @param {import('zod').ZodType} schema
 * @param {'body' | 'query' | 'params'} [source='body']
 */
module.exports = function validateZod(schema, source = "body") {
  return (req, res, next) => {
    const raw =
      source === "query"
        ? req.query
        : source === "params"
          ? req.params
          : req.body;

    const parsed = schema.safeParse(raw);

    if (!parsed.success) {
      const issues = parsed.error.issues.map((issue) => ({
        path: issue.path.length ? issue.path.join(".") : "(root)",
        message: issue.message,
        code: issue.code,
      }));
      const first = issues[0];
      return res.status(400).json({
        error: first
          ? `${first.path}: ${first.message}`
          : "Nevalidan zahtev.",
        issues,
      });
    }

    const value = parsed.data;

    if (source === "query") {
      req.validatedQuery = value;
    } else if (source === "params") {
      req.validatedParams = value;
    } else {
      Object.assign(req.body, value);
    }

    next();
  };
};
