const Joi = require("joi");

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const listAppointmentsQuerySchema = Joi.object({
  day: Joi.alternatives().try(
    Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
    Joi.string().valid("today")
  ),
  date: Joi.string().valid("today"),
  from: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
  to: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
  timezone: Joi.string().max(64),
})
  .unknown(false)
  .custom((value, helpers) => {
    const out = { ...value };
    if (out.date !== undefined) {
      out.day = out.date;
    }
    delete out.date;

    const hasFrom = out.from !== undefined;
    const hasTo = out.to !== undefined;
    if (hasFrom !== hasTo) {
      return helpers.error("any.custom", {
        message: "from and to must be used together",
      });
    }
    const hasRange = hasFrom && hasTo;
    const hasDay = out.day !== undefined;

    if (hasRange && hasDay) {
      return helpers.error("any.custom", {
        message: "Use either day or from/to range, not both",
      });
    }

    if (hasRange) {
      if (out.from > out.to) {
        return helpers.error("any.custom", {
          message: "from must be <= to",
        });
      }
      out.timezone = out.timezone ?? "UTC";
      delete out.day;
      return out;
    }

    if (hasDay) {
      out.timezone = out.timezone ?? "UTC";
      delete out.from;
      delete out.to;
      return out;
    }

    delete out.from;
    delete out.to;
    if (out.timezone !== undefined) {
      return helpers.error("any.custom", {
        message: "timezone requires day or from/to",
      });
    }
    return out;
  });

const createAppointmentSchema = Joi.object({
  client_id: Joi.number().integer().positive().required(),
  service_id: Joi.number().integer().positive().required(),
  date: Joi.date().iso().required(),
  status: Joi.string().valid("scheduled", "completed", "no_show"),
  staff_user_id: Joi.number().integer().positive().allow(null),
  send_sms: Joi.boolean().default(false),
  send_whatsapp: Joi.boolean().default(false),
  send_email: Joi.boolean().default(false),
});

const updateAppointmentSchema = Joi.object({
  client_id: Joi.number().integer().positive(),
  service_id: Joi.number().integer().positive(),
  date: Joi.date().iso(),
  status: Joi.string().valid("scheduled", "completed", "no_show"),
  staff_user_id: Joi.number().integer().positive().allow(null),
})
  .min(1)
  .messages({
    "object.min": "At least one field is required",
  });

module.exports = {
  idParamSchema,
  listAppointmentsQuerySchema,
  createAppointmentSchema,
  updateAppointmentSchema,
};
