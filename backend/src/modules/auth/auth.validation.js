const Joi = require("joi");

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  organization_name: Joi.string().trim().min(1).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  remember: Joi.boolean().optional(),
  otp: Joi.string().trim().min(6).max(10).optional(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().trim().min(16).required(),
  password: Joi.string().min(8).required(),
});

const enable2faSchema = Joi.object({
  otp: Joi.string().trim().min(6).max(10).required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  enable2faSchema,
};
