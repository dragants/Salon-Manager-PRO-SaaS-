const Joi = require("joi");

const slotsQuerySchema = Joi.object({
  service_id: Joi.number().integer().positive().required(),
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  timezone: Joi.string().max(64),
});

const bookBodySchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  phone: Joi.string().min(3).max(40).required(),
  email: Joi.string().email().max(320).allow(null, ""),
  service_id: Joi.number().integer().positive().required(),
  start: Joi.string().min(10).required(),
  timezone: Joi.string().max(64),
  /** Obavezno kad salon koristi smene (work_shifts) za taj dan. */
  staff_user_id: Joi.number().integer().positive().optional().allow(null),
});

module.exports = { slotsQuerySchema, bookBodySchema };
