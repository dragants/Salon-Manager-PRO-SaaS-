const Joi = require("joi");

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const createProgramSchema = Joi.object({
  service_id: Joi.number().integer().positive().required(),
  name: Joi.string().min(1).max(120).required(),
  visits_required: Joi.number().integer().min(2).max(365).required(),
  is_active: Joi.boolean().optional(),
});

const patchProgramSchema = Joi.object({
  name: Joi.string().min(1).max(120),
  visits_required: Joi.number().integer().min(2).max(365),
  is_active: Joi.boolean(),
})
  .min(1)
  .messages({
    "object.min": "Potrebno je poslati bar jedno polje za izmenu.",
  });

const eligibilityQuerySchema = Joi.object({
  client_id: Joi.number().integer().positive().required(),
  service_id: Joi.number().integer().positive().required(),
});

module.exports = {
  idParamSchema,
  createProgramSchema,
  patchProgramSchema,
  eligibilityQuerySchema,
};
