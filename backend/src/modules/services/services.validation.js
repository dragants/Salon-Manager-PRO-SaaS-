const Joi = require("joi");

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const createServiceSchema = Joi.object({
  name: Joi.string().min(2).required(),
  price: Joi.number().min(0).required(),
  duration: Joi.number().integer().min(1).default(60),
  buffer_minutes: Joi.number().integer().min(0).max(240).default(0),
  category_id: Joi.number().integer().positive().allow(null),
  color: Joi.string().max(20).allow(null, ""),
  description: Joi.string().max(500).allow(null, ""),
});

const updateServiceSchema = Joi.object({
  name: Joi.string().min(2),
  price: Joi.number().min(0),
  duration: Joi.number().integer().min(1),
  buffer_minutes: Joi.number().integer().min(0).max(240),
  category_id: Joi.number().integer().positive().allow(null),
  color: Joi.string().max(20).allow(null, ""),
  description: Joi.string().max(500).allow(null, ""),
})
  .min(1)
  .messages({
    "object.min": "At least one field is required",
  });

/* ── Category schemas ── */

const createCategorySchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  sort_order: Joi.number().integer().min(0).default(0),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(1).max(100),
  sort_order: Joi.number().integer().min(0),
})
  .min(1)
  .messages({
    "object.min": "At least one field is required",
  });

module.exports = {
  idParamSchema,
  createServiceSchema,
  updateServiceSchema,
  createCategorySchema,
  updateCategorySchema,
};
