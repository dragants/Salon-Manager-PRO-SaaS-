const Joi = require("joi");

const workerProfileSchema = Joi.object({
  service_ids: Joi.array().items(Joi.number().integer().positive()).max(500),
  working_hours: Joi.object().unknown(true),
})
  .unknown(false)
  .default({});

const createTeamMemberSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().valid("admin", "worker").required(),
  display_name: Joi.string().trim().max(200).allow(null, ""),
});

const patchTeamMemberSchema = Joi.object({
  display_name: Joi.string().trim().max(200).allow(null, ""),
  role: Joi.string().valid("admin", "worker"),
  email: Joi.string().email(),
  password: Joi.string().min(8).max(128),
  worker_profile: workerProfileSchema,
})
  .min(1)
  .messages({
    "object.min": "Pošalji bar jedno polje za izmenu.",
  });

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).max(128).required(),
})
  .unknown(false)
  .custom((value, helpers) => {
    if (value.current_password === value.new_password) {
      return helpers.error("any.custom", {
        message: "Nova lozinka mora se razlikovati od trenutne.",
      });
    }
    return value;
  });

const pushSubscriptionSchema = Joi.object({
  endpoint: Joi.string().uri().required(),
  keys: Joi.object({
    p256dh: Joi.string().required(),
    auth: Joi.string().required(),
  })
    .required()
    .unknown(false),
  expirationTime: Joi.any().optional().allow(null),
})
  .unknown(true)
  .required();

const pushUnsubscribeSchema = Joi.object({
  endpoint: Joi.string().uri().optional().allow(null, ""),
}).unknown(false);

module.exports = {
  createTeamMemberSchema,
  patchTeamMemberSchema,
  changePasswordSchema,
  pushSubscriptionSchema,
  pushUnsubscribeSchema,
};
