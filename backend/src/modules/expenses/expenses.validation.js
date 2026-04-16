const Joi = require("joi");

const ymd = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .required();

const listQuerySchema = Joi.object({
  from: ymd,
  to: ymd,
});

const createExpenseSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  amount_rsd: Joi.number().integer().min(0).max(2_000_000_000).required(),
  category: Joi.string().max(80).allow("", null),
  notes: Joi.string().max(2000).allow("", null),
  spent_at: ymd,
});

const updateExpenseSchema = Joi.object({
  title: Joi.string().min(1).max(200),
  amount_rsd: Joi.number().integer().min(0).max(2_000_000_000),
  category: Joi.string().max(80).allow("", null),
  notes: Joi.string().max(2000).allow("", null),
  spent_at: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
})
  .min(1)
  .messages({
    "object.min": "Potrebno je poslati bar jedno polje za izmenu.",
  });

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

module.exports = {
  listQuerySchema,
  createExpenseSchema,
  updateExpenseSchema,
  idParamSchema,
};
