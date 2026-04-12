const Joi = require("joi");

const emailField = Joi.string()
  .trim()
  .max(254)
  .allow(null, "")
  .optional()
  .custom((value, helpers) => {
    if (value == null || value === "") return null;
    const { error } = Joi.string()
      .email({ tlds: { allow: false } })
      .validate(value);
    if (error) {
      return helpers.error("string.email");
    }
    return value.toLowerCase();
  });

const createClientSchema = Joi.object({
  name: Joi.string().min(2).required(),
  phone: Joi.string().min(6).required(),
  email: emailField,
  notes: Joi.string().allow(""),
});

const updateClientSchema = Joi.object({
  name: Joi.string().min(2),
  phone: Joi.string().min(6),
  email: emailField,
  notes: Joi.string().allow("", null),
})
  .min(1)
  .messages({
    "object.min": "At least one field is required",
  });

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const idFileParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  fileId: Joi.number().integer().positive().required(),
});

const chartFileSchema = Joi.object({
  filename: Joi.string().max(255).required(),
  mime_type: Joi.string().max(127).required(),
  data_base64: Joi.string().required(),
});

const createChartEntrySchema = Joi.object({
  visit_at: Joi.date().iso().optional(),
  title: Joi.string().max(500).allow("", null),
  notes: Joi.string().max(50000).allow("", null),
  appointment_id: Joi.number().integer().positive().allow(null),
  files: Joi.array().items(chartFileSchema).max(5).default([]),
})
  .custom((value, helpers) => {
    const title = (value.title || "").trim();
    const notes = (value.notes || "").trim();
    const hasFiles = Array.isArray(value.files) && value.files.length > 0;
    if (!title && !notes && !hasFiles) {
      return helpers.error("any.custom", {
        message:
          "Provide title, notes, or at least one file for the chart entry",
      });
    }
    return value;
  });

module.exports = {
  createClientSchema,
  updateClientSchema,
  idParamSchema,
  idFileParamSchema,
  createChartEntrySchema,
};
