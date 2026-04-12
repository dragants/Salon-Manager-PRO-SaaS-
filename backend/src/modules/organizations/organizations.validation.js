const Joi = require("joi");

const remindersShape = {
  dayBefore: Joi.boolean(),
  twoHoursBefore: Joi.boolean(),
  dayBeforeHour: Joi.number().integer().min(0).max(23).allow(null),
  customReminderHours: Joi.number().integer().min(0).max(168).allow(null),
  channelSms: Joi.boolean(),
  channelWhatsApp: Joi.boolean(),
  /** E-mail podsetnik (SMTP iz booking_notifications). */
  channelEmail: Joi.boolean(),
  noShowFollowup: Joi.boolean(),
};

const patchOrganizationSettingsSchema = Joi.object({
  name: Joi.string().min(1).max(200),
  phone: Joi.string().max(64).allow(null, ""),
  address: Joi.string().max(500).allow(null, ""),
  logo: Joi.string().max(2048).allow(null, ""),
  theme_color: Joi.string().max(32).allow(null, ""),
  timezone: Joi.string().max(64).allow(null),
  /** Javni URL segment: /book/{booking_slug} */
  booking_slug: Joi.alternatives().try(
    Joi.valid(null, ""),
    Joi.string()
      .max(64)
      .trim()
      .lowercase()
      .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  ),
  reminders: Joi.object(remindersShape),
  working_hours: Joi.object().unknown(true).allow(null),
  settings: Joi.object().unknown(true),
})
  .min(1)
  .custom((value, helpers) => {
    const tracked = [
      "name",
      "phone",
      "address",
      "logo",
      "theme_color",
      "timezone",
      "booking_slug",
      "reminders",
      "working_hours",
      "settings",
    ];
    const hasAny = tracked.some((k) => value[k] !== undefined);
    if (!hasAny) {
      return helpers.error("any.custom", {
        message: "Provide at least one field to update",
      });
    }
    if (
      value.reminders !== undefined &&
      Object.keys(value.reminders).length < 1
    ) {
      return helpers.error("any.custom", {
        message: "reminders must include at least one field",
      });
    }
    return value;
  });

module.exports = { patchOrganizationSettingsSchema };
