const pool = require("../../config/db");
const { assertValidTimeZone } = require("../../utils/timezone");

function mergeBookingNotificationSecrets(prevSettings, nextSettings) {
  const prevBn = prevSettings.booking_notifications;
  const nextBn = nextSettings.booking_notifications;
  if (!nextBn || typeof nextBn !== "object") {
    return;
  }

  if (prevBn && typeof prevBn === "object") {
    const pSmtp = prevBn.smtp;
    const nSmtp = nextBn.smtp;
    if (pSmtp && nSmtp && typeof nSmtp === "object") {
      const pw = nSmtp.password;
      if (
        (pw === undefined || pw === null || String(pw).trim() === "") &&
        pSmtp.password
      ) {
        nextBn.smtp = { ...nSmtp, password: pSmtp.password };
      }
    }
    const tok = nextBn.twilio_auth_token;
    if (
      (tok === undefined || tok === null || String(tok).trim() === "") &&
      prevBn.twilio_auth_token
    ) {
      nextBn.twilio_auth_token = prevBn.twilio_auth_token;
    }
  }
}

function bookingNotificationsForApi(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const smtpIn = r.smtp && typeof r.smtp === "object" ? r.smtp : {};
  const hasPw = Boolean(smtpIn.password && String(smtpIn.password).trim());
  return {
    public_booking_sms: r.public_booking_sms !== false,
    public_booking_email: r.public_booking_email === true,
    public_booking_whatsapp: r.public_booking_whatsapp === true,
    smtp: {
      host: smtpIn.host != null ? String(smtpIn.host) : "",
      port:
        typeof smtpIn.port === "number" && smtpIn.port > 0
          ? smtpIn.port
          : 587,
      secure: Boolean(smtpIn.secure),
      user: smtpIn.user != null ? String(smtpIn.user) : "",
      from_email:
        smtpIn.from_email != null ? String(smtpIn.from_email) : "",
      from_name: smtpIn.from_name != null ? String(smtpIn.from_name) : "",
      smtp_password_configured: hasPw,
    },
    twilio_account_sid:
      r.twilio_account_sid != null ? String(r.twilio_account_sid) : "",
    twilio_from: r.twilio_from != null ? String(r.twilio_from) : "",
    twilio_configured: Boolean(
      r.twilio_account_sid &&
        r.twilio_auth_token &&
        String(r.twilio_auth_token).trim() &&
        r.twilio_from
    ),
  };
}

/** @type {boolean | undefined} true = kolona postoji, false = nije u bazi (migracija 009) */
let orgBookingSlugColumnCache;

const ORG_GET_BY_ID_WITH_SLUG = `SELECT id, name, phone, email, address, logo, working_hours, settings, booking_slug, created_at
     FROM organizations WHERE id = $1`;
const ORG_GET_BY_ID_NO_SLUG = `SELECT id, name, phone, email, address, logo, working_hours, settings, created_at
     FROM organizations WHERE id = $1`;
const ORG_PATCH_SELECT_WITH_SLUG = `SELECT name, phone, email, address, logo, settings, working_hours, booking_slug
     FROM organizations WHERE id = $1`;
const ORG_PATCH_SELECT_NO_SLUG = `SELECT name, phone, email, address, logo, settings, working_hours
     FROM organizations WHERE id = $1`;

/** Kolona booking_slug ili rezerva u settings.booking_slug (ako migracija 009 nije primenjena). */
function resolveBookingSlugForRow(row) {
  const fromCol =
    row.booking_slug != null && String(row.booking_slug).trim() !== ""
      ? String(row.booking_slug).trim().toLowerCase()
      : null;
  if (fromCol) {
    return fromCol;
  }
  const s = row.settings || {};
  if (typeof s.booking_slug === "string" && s.booking_slug.trim()) {
    return s.booking_slug.trim().toLowerCase();
  }
  return null;
}

function attachResolvedBookingSlug(row) {
  row.booking_slug = resolveBookingSlugForRow(row);
  return row;
}

async function getById(orgId) {
  const notFound = () => {
    const err = new Error("Organization not found");
    err.statusCode = 404;
    throw err;
  };

  if (orgBookingSlugColumnCache === true) {
    const res = await pool.query(ORG_GET_BY_ID_WITH_SLUG, [orgId]);
    if (res.rows.length === 0) {
      notFound();
    }
    return attachResolvedBookingSlug(res.rows[0]);
  }

  try {
    const res = await pool.query(ORG_GET_BY_ID_WITH_SLUG, [orgId]);
    if (res.rows.length === 0) {
      notFound();
    }
    orgBookingSlugColumnCache = true;
    return attachResolvedBookingSlug(res.rows[0]);
  } catch (e) {
    if (e.code !== "42703") {
      throw e;
    }
    orgBookingSlugColumnCache = false;
    const res = await pool.query(ORG_GET_BY_ID_NO_SLUG, [orgId]);
    if (res.rows.length === 0) {
      notFound();
    }
    return attachResolvedBookingSlug(res.rows[0]);
  }
}

async function selectOrgRowForPatch(orgId) {
  if (orgBookingSlugColumnCache === true) {
    return pool.query(ORG_PATCH_SELECT_WITH_SLUG, [orgId]);
  }
  try {
    const r = await pool.query(ORG_PATCH_SELECT_WITH_SLUG, [orgId]);
    orgBookingSlugColumnCache = true;
    return r;
  } catch (e) {
    if (e.code !== "42703") {
      throw e;
    }
    orgBookingSlugColumnCache = false;
    return pool.query(ORG_PATCH_SELECT_NO_SLUG, [orgId]);
  }
}

async function patchSettings(orgId, body) {
  const currentRes = await selectOrgRowForPatch(orgId);
  if (currentRes.rows.length === 0) {
    const err = new Error("Organization not found");
    err.statusCode = 404;
    throw err;
  }

  const row = currentRes.rows[0];
  attachResolvedBookingSlug(row);
  const current = row.settings || {};
  const next = { ...current };

  if (body.settings && typeof body.settings === "object") {
    for (const [k, v] of Object.entries(body.settings)) {
      if (v === null) {
        delete next[k];
      } else if (
        k === "finance" &&
        typeof v === "object" &&
        !Array.isArray(v)
      ) {
        next.finance = { ...(current.finance || {}), ...v };
      } else {
        next[k] = v;
      }
    }
  }

  let name = row.name;
  if (body.name !== undefined) {
    name = body.name;
  }

  let phone = row.phone;
  if (body.phone !== undefined) {
    phone = body.phone === "" ? null : body.phone;
  }

  let address = row.address;
  if (body.address !== undefined) {
    address = body.address === "" ? null : body.address;
  }

  let logo = row.logo;
  if (body.logo !== undefined) {
    logo = body.logo === "" ? null : body.logo;
  }

  if (body.theme_color !== undefined) {
    if (body.theme_color === null || body.theme_color === "") {
      delete next.theme_color;
    } else {
      next.theme_color = body.theme_color;
    }
  }

  let workingHours = row.working_hours;
  if (body.working_hours !== undefined) {
    workingHours = body.working_hours === null ? {} : body.working_hours;
  }

  if (body.timezone !== undefined) {
    if (body.timezone === null) {
      delete next.timezone;
    } else {
      assertValidTimeZone(body.timezone);
      next.timezone = body.timezone;
    }
  }

  if (body.reminders) {
    next.reminders = { ...(current.reminders || {}) };
    for (const [key, value] of Object.entries(body.reminders)) {
      if (value === null) {
        delete next.reminders[key];
      } else {
        next.reminders[key] = value;
      }
    }
  }

  let bookingSlug = row.booking_slug ?? null;
  if (body.booking_slug !== undefined) {
    const v = body.booking_slug;
    bookingSlug =
      v === null || v === "" ? null : String(v).trim().toLowerCase();
    if (bookingSlug === null || bookingSlug === "") {
      delete next.booking_slug;
    } else {
      next.booking_slug = bookingSlug;
    }
  }

  mergeBookingNotificationSecrets(current, next);

  const updateWithSlug = () => {
    const settingsPayload = { ...next };
    delete settingsPayload.booking_slug;
    return pool.query(
      `UPDATE organizations
       SET name = $1, phone = $2, address = $3, logo = $4,
           settings = $5::jsonb, working_hours = $6::jsonb, booking_slug = $7
       WHERE id = $8
       RETURNING id, name, phone, email, address, logo, working_hours, settings, booking_slug, created_at`,
      [name, phone, address, logo, settingsPayload, workingHours, bookingSlug, orgId]
    );
  };

  const updateNoSlug = () =>
    pool.query(
      `UPDATE organizations
       SET name = $1, phone = $2, address = $3, logo = $4,
           settings = $5::jsonb, working_hours = $6::jsonb
       WHERE id = $7
       RETURNING id, name, phone, email, address, logo, working_hours, settings, created_at`,
      [name, phone, address, logo, next, workingHours, orgId]
    );

  try {
    let res;
    if (orgBookingSlugColumnCache === true) {
      res = await updateWithSlug();
    } else {
      try {
        res = await updateWithSlug();
        orgBookingSlugColumnCache = true;
      } catch (e) {
        if (e.code !== "42703") {
          throw e;
        }
        orgBookingSlugColumnCache = false;
        res = await updateNoSlug();
      }
    }
    attachResolvedBookingSlug(res.rows[0]);
    return res.rows[0];
  } catch (e) {
    if (e.code === "23505") {
      const err = new Error("Ovaj link za rezervacije je već zauzet.");
      err.statusCode = 409;
      throw err;
    }
    throw e;
  }
}

async function getSettingsBundle(orgId) {
  const org = await getById(orgId);
  const settings = org.settings || {};
  const wh = org.working_hours;

  const branding = settings.branding || {};
  const calendar_rules = settings.calendar_rules || {};
  const finance = settings.finance || {};
  const automation = settings.automation || {};
  const worker_permissions = settings.worker_permissions || {};

  return {
    name: org.name,
    phone: org.phone ?? null,
    email: org.email ?? null,
    address: org.address ?? null,
    working_hours: wh ?? {},
    theme_color:
      settings.theme_color ||
      settings.primary_color ||
      "#6366F1",
    logo: org.logo ?? null,
    timezone: settings.timezone ?? null,
    reminders: settings.reminders ?? {},
    branding: {
      display_name: branding.display_name ?? "",
      instagram: branding.instagram ?? "",
    },
    calendar_rules: {
      min_gap_minutes: calendar_rules.min_gap_minutes ?? 30,
      max_clients_per_hour: calendar_rules.max_clients_per_hour ?? 4,
      allow_overlap: Boolean(calendar_rules.allow_overlap),
      buffer_between_minutes: calendar_rules.buffer_between_minutes ?? 0,
    },
    finance: {
      currency: finance.currency ?? "RSD",
      vat_enabled: Boolean(finance.vat_enabled),
      accept_cash: finance.accept_cash !== false,
      accept_card: finance.accept_card !== false,
      monthly_overhead_rsd: (() => {
        const v = finance.monthly_overhead_rsd;
        if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
          return Math.round(v);
        }
        if (typeof v === "string" && String(v).trim() !== "") {
          const n = Number(String(v).replace(",", "."));
          return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
        }
        return 0;
      })(),
    },
    automation: {
      auto_confirm_booking: Boolean(automation.auto_confirm_booking),
      reminder_template: automation.reminder_template ?? "",
      no_show_offer_new_slot: Boolean(automation.no_show_offer_new_slot),
    },
    worker_permissions: {
      can_delete: Boolean(worker_permissions.can_delete),
    },
    booking_slug: org.booking_slug ?? null,
    /** Javni URL frontenda (https://domen.com) — za deljenje linka i dokumentaciju; opciono. */
    public_site_url:
      typeof settings.public_site_url === "string"
        ? settings.public_site_url.trim()
        : "",
    booking_notifications: bookingNotificationsForApi(
      settings.booking_notifications
    ),
  };
}

async function getWorkerCanDelete(orgId) {
  const org = await getById(orgId);
  const s = org.settings || {};
  const wp = s.worker_permissions || {};
  return Boolean(wp.can_delete);
}

module.exports = {
  getById,
  patchSettings,
  getSettingsBundle,
  getWorkerCanDelete,
};
