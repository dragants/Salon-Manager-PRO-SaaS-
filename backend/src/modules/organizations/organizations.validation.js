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
    if (value.settings && typeof value.settings.finance === "object") {
      const f = value.settings.finance;
      if (f.monthly_overhead_rsd != null) {
        const n = Number(f.monthly_overhead_rsd);
        if (!Number.isFinite(n) || n < 0 || n > 999_999_999) {
          return helpers.error("any.custom", {
            message:
              "finance.monthly_overhead_rsd mora biti između 0 i 999.999.999",
          });
        }
      }
      if (f.currency != null) {
        const c = String(f.currency).trim().toUpperCase();
        if (c.length < 3 || c.length > 8 || !/^[A-Z0-9]+$/.test(c)) {
          return helpers.error("any.custom", {
            message: "Neispravan kod valute (npr. RSD, EUR).",
          });
        }
      }
    }
    return value;
  });

module.exports = { patchOrganizationSettingsSchema };
