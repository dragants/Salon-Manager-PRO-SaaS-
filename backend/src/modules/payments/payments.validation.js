const Joi = require("joi");

const createPaymentSchema = Joi.object({
  amount: Joi.number().required(),
  date: Joi.date().iso(),
});

module.exports = { createPaymentSchema };
