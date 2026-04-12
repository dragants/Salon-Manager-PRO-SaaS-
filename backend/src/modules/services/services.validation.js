const Joi = require("joi");

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const createServiceSchema = Joi.object({
  name: Joi.string().min(2).required(),
  price: Joi.number().min(0).required(),
  duration: Joi.number().integer().min(1).default(60),
  buffer_minutes: Joi.number().integer().min(0).max(240).default(0),
});

const updateServiceSchema = Joi.object({
  name: Joi.string().min(2),
  price: Joi.number().min(0),
  duration: Joi.number().integer().min(1),
  buffer_minutes: Joi.number().integer().min(0).max(240),
})
  .min(1)
  .messages({
    "object.min": "At least one field is required",
  });

module.exports = {
  idParamSchema,
  createServiceSchema,
  updateServiceSchema,
};
