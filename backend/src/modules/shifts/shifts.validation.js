const Joi = require("joi");

const listShiftsQuerySchema = Joi.object({
  day: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  timezone: Joi.string().max(64).optional(),
}).unknown(false);

const replaceShiftsQuerySchema = Joi.object({
  day: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  timezone: Joi.string().max(64).optional(),
}).unknown(false);

const hhmm = Joi.string().pattern(/^\d{2}:\d{2}$/);

const replaceShiftsBodySchema = Joi.object({
  shifts: Joi.array()
    .items(
      Joi.object({
        user_id: Joi.number().integer().positive().required(),
        start: hhmm.required(),
        end: hhmm.required(),
      })
    )
    .required(),
}).unknown(false);

module.exports = {
  listShiftsQuerySchema,
  replaceShiftsQuerySchema,
  replaceShiftsBodySchema,
};
