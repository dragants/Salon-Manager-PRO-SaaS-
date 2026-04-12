const Joi = require("joi");

const listAuditQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(200),
  action: Joi.string().trim().max(64).allow("", null),
})
  .unknown(true)
  .custom((value, helpers) => {
    const out = { ...value };
    if (out.action === "" || out.action == null) {
      delete out.action;
    }
    if (out.limit === undefined) {
      delete out.limit;
    }
    return out;
  });

module.exports = { listAuditQuerySchema };
