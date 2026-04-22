const Joi = require("joi");

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const createItemSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  unit: Joi.string().min(1).max(32).default("kom"),
  reorder_min: Joi.number().min(0).allow(null),
  notes: Joi.string().max(2000).allow("", null),
});

const patchItemSchema = Joi.object({
  name: Joi.string().min(1).max(200),
  unit: Joi.string().min(1).max(32),
  reorder_min: Joi.number().min(0).allow(null),
  notes: Joi.string().max(2000).allow("", null),
})
  .min(1)
  .messages({
    "object.min": "Potrebno je poslati bar jedno polje za izmenu.",
  });

const movementsQuerySchema = Joi.object({
  supply_item_id: Joi.number().integer().positive().optional(),
  limit: Joi.number().integer().min(1).max(200).default(80),
});

const createMovementSchema = Joi.object({
  supply_item_id: Joi.number().integer().positive().required(),
  movement_type: Joi.string()
    .valid("purchase", "usage", "adjustment")
    .required(),
  quantity: Joi.number().positive().optional(),
  target_quantity: Joi.number().min(0).optional(),
  note: Joi.string().max(500).allow("", null),
  appointment_id: Joi.number().integer().positive().allow(null),
});

const serviceUsageParamsSchema = Joi.object({
  serviceId: Joi.number().integer().positive().required(),
});

const setServiceUsageSchema = Joi.object({
  supply_item_id: Joi.number().integer().positive().required(),
  qty_per_use: Joi.number().positive().required(),
});

const removeServiceUsageSchema = Joi.object({
  supply_item_id: Joi.number().integer().positive().required(),
});

module.exports = {
  idParamSchema,
  createItemSchema,
  patchItemSchema,
  movementsQuerySchema,
  createMovementSchema,
  serviceUsageParamsSchema,
  setServiceUsageSchema,
  removeServiceUsageSchema,
};
