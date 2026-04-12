const Joi = require("joi");

const getAvailabilityQuerySchema = Joi.object({
  day: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  service_id: Joi.number().integer().positive().required(),
  staff_user_id: Joi.number().integer().positive().optional(),
}).unknown(false);

module.exports = { getAvailabilityQuerySchema };
