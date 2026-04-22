const { z } = require("zod");

/** YYYY-MM-DD */
const dateYmd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Datum mora biti u formatu YYYY-MM-DD");

/** Kratak link salona (booking slug) */
const slugSegment = z
  .string()
  .trim()
  .min(1, "Slug je obavezan")
  .max(160, "Slug je predugačak")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/i,
    "Slug sme samo slova, brojeve i crtice"
  );

const publicSlugParamsSchema = z.object({
  slug: slugSegment,
});

const slotsQuerySchema = z.object({
  service_id: z.coerce
    .number({ invalid_type_error: "service_id mora biti broj" })
    .int()
    .positive("service_id mora biti pozitivan"),
  date: dateYmd,
  timezone: z
    .string()
    .max(64, "timezone predugačak")
    .optional()
    .transform((v) => (v && String(v).trim() ? String(v).trim() : undefined)),
});

const bookBodySchema = z.object({
  name: z
    .string({ required_error: "Ime je obavezno" })
    .min(1, "Ime je obavezno")
    .max(200, "Ime je predugačko"),
  phone: z
    .string({ required_error: "Telefon je obavezan" })
    .min(3, "Telefon mora imati bar 3 karaktera")
    .max(40, "Telefon je predugačak"),
  email: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.string().email("Neispravna e-mail adresa").max(320).optional()
  ),
  service_id: z.coerce
    .number({ invalid_type_error: "service_id mora biti broj" })
    .int()
    .positive("service_id mora biti pozitivan"),
  start: z
    .string({ required_error: "start (ISO vreme) je obavezno" })
    .min(10, "start mora biti ispravno ISO vreme"),
  timezone: z
    .string()
    .max(64, "timezone predugačak")
    .optional()
    .transform((v) => (v && String(v).trim() ? String(v).trim() : undefined)),
  staff_user_id: z.preprocess((val) => {
    if (val === null || val === undefined || val === "") {
      return undefined;
    }
    const n = Number(val);
    return Number.isFinite(n) && Number.isInteger(n) && n > 0 ? n : undefined;
  }, z.number().int().positive().optional()),
});

module.exports = {
  publicSlugParamsSchema,
  slotsQuerySchema,
  bookBodySchema,
};
