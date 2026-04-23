const pool = require("../../config/db");
const sms = require("../../services/sms.service");
const whatsapp = require("../../services/whatsapp.service");
const emailService = require("../../services/email.service");
const notificationsQueue = require("../../../../queue/notifications");

function defaultAppTimeZone() {
  return process.env.APP_TIMEZONE || "Europe/Belgrade";
}

function resolveDisplayTimeZone(row) {
  if (row.org_timezone) {
    return row.org_timezone;
  }
  if (row.org_timezone_setting) {
    return row.org_timezone_setting;
  }
  return defaultAppTimeZone();
}

function formatAppointmentWhen(isoDate, timeZoneOverride) {
  const tz = timeZoneOverride || defaultAppTimeZone();
  return new Date(isoDate).toLocaleString("sr-Latn-RS", {
    timeZone: tz,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatAppointmentTimeOnly(isoDate, timeZoneOverride) {
  const tz = timeZoneOverride || defaultAppTimeZone();
  return new Date(isoDate).toLocaleTimeString("sr-Latn-RS", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dayBeforeReminderHourLabel() {
  const h = parseInt(process.env.REMINDER_DAY_BEFORE_HOUR || "17", 10);
  if (Number.isNaN(h) || h < 0 || h > 23) {
    return "17";
  }
  return String(h);
}

function whatsappRecipientDigits(phone) {
  return String(phone).replace(/\D/g, "");
}

function hasSms(twilioOverride) {
  if (twilioOverride) {
    return true;
  }
  return Boolean(
    process.env.TWILIO_SID &&
      process.env.TWILIO_TOKEN &&
      process.env.TWILIO_PHONE
  );
}

function twilioOverrideFromBookingNotifications(bn) {
  if (!bn || typeof bn !== "object") {
    return null;
  }
  const sid = bn.twilio_account_sid && String(bn.twilio_account_sid).trim();
  const token = bn.twilio_auth_token && String(bn.twilio_auth_token).trim();
  const from = bn.twilio_from && String(bn.twilio_from).trim();
  if (sid && token && from) {
    return { accountSid: sid, authToken: token, from };
  }
  return null;
}

function hasWhatsApp() {
  return Boolean(process.env.WA_TOKEN && process.env.WA_PHONE_ID);
}

/** Kandidat za podsetnik: telefon za SMS/WA i/ili e-mail ako je channelEmail uključen. */
const REMINDER_CONTACT_FILTER = `(
  (
    (
      (o.settings->'reminders'->>'channelSms' IS NULL OR o.settings->'reminders'->>'channelSms' = 'true')
      OR (o.settings->'reminders'->>'channelWhatsApp' IS NULL OR o.settings->'reminders'->>'channelWhatsApp' = 'true')
    )
    AND c.phone IS NOT NULL
    AND btrim(c.phone) <> ''
  )
  OR (
    o.settings->'reminders'->>'channelEmail' = 'true'
    AND c.email IS NOT NULL
    AND btrim(c.email) <> ''
  )
)`;

/**
 * Jedan kanal po terminu: SMS → WhatsApp → e-mail (prvi uspeh).
 * Poštuje reminders.channelSms / channelWhatsApp / channelEmail i Twilio po salonu.
 */
async function deliverReminderChannels({
  clientPhone,
  clientEmail,
  message,
  orgSettings,
}) {
  const rem = orgSettings.reminders || {};
  const wantSms = rem.channelSms !== false;
  const wantWa = rem.channelWhatsApp !== false;
  const wantEmail = rem.channelEmail === true;

  const bn = orgSettings.booking_notifications || {};
  const twilioOrg = twilioOverrideFromBookingNotifications(bn);

  let anyOk = false;

  if (
    wantSms &&
    clientPhone &&
    String(clientPhone).trim() &&
    hasSms(twilioOrg)
  ) {
    try {
      await sms.sendSMS(clientPhone, message, twilioOrg);
      anyOk = true;
    } catch (e) {
      console.error("Reminder SMS failed", e);
    }
  }

  if (
    !anyOk &&
    wantWa &&
    clientPhone &&
    String(clientPhone).trim() &&
    hasWhatsApp()
  ) {
    try {
      const to = whatsappRecipientDigits(clientPhone);
      if (to) {
        await whatsapp.sendWhatsApp(to, message);
        anyOk = true;
      }
    } catch (e) {
      console.error("Reminder WhatsApp failed", e);
    }
  }

  if (
    !anyOk &&
    wantEmail &&
    clientEmail &&
    String(clientEmail).trim() &&
    emailService.isSmtpReady(bn)
  ) {
    try {
      const salonName =
        (orgSettings.branding &&
          orgSettings.branding.display_name &&
          String(orgSettings.branding.display_name).trim()) ||
        "";
      const subj = salonName
        ? `Podsetnik — ${salonName}`
        : "Podsetnik termina";
      const to = String(clientEmail).trim();
      const textBody = `${message}\n\n—`;
      const htmlBody = `<p>${message.replace(/\n/g, "<br/>")}</p>`;
      await emailService.sendBookingConfirmationEmail(bn, {
        to,
        subject: subj,
        text: textBody,
        html: htmlBody,
      });
      anyOk = true;
    } catch (e) {
      console.error("Reminder email failed", e);
    }
  }

  return { ok: anyOk };
}

async function sendMessageBestEffort(phone, message, twilioOverride = null) {
  if (!phone || !String(phone).trim()) {
    return { ok: false, reason: "no_phone" };
  }

  if (hasSms(twilioOverride)) {
    try {
      await sms.sendSMS(phone, message, twilioOverride);
      return { ok: true, channel: "sms" };
    } catch (e) {
      console.error("SMS delivery failed", e);
    }
  }

  if (hasWhatsApp()) {
    try {
      const to = whatsappRecipientDigits(phone);
      if (!to) {
        return { ok: false, reason: "invalid_phone" };
      }
      await whatsapp.sendWhatsApp(to, message);
      return { ok: true, channel: "whatsapp" };
    } catch (e) {
      console.error("WhatsApp delivery failed", e);
    }
  }

  return { ok: false, reason: "no_provider_or_failed" };
}

async function recordNotificationSent(orgId, appointmentId, kind) {
  await pool.query(
    `INSERT INTO appointment_notification_log (organization_id, appointment_id, kind)
     VALUES ($1, $2, $3)
     ON CONFLICT (appointment_id, kind) DO NOTHING`,
    [orgId, appointmentId, kind]
  );
}

async function alreadyNotified(appointmentId, kind) {
  const r = await pool.query(
    `SELECT 1 FROM appointment_notification_log
     WHERE appointment_id = $1 AND kind = $2`,
    [appointmentId, kind]
  );
  return r.rowCount > 0;
}

async function sendBookingNotifications(
  orgId,
  appointment,
  { sendSms, sendWhatsApp, sendEmail }
) {
  const out = {
    sms: "skipped",
    whatsapp: "skipped",
    email: "skipped",
  };

  const orgRes = await pool.query(
    `SELECT settings FROM organizations WHERE id = $1`,
    [orgId]
  );
  const orgSettings = orgRes.rows[0]?.settings || {};
  const tz =
    (orgSettings.timezone && String(orgSettings.timezone).trim()) ||
    defaultAppTimeZone();
  const bn = orgSettings.booking_notifications || {};
  const twilioOrg = twilioOverrideFromBookingNotifications(bn);

  const [clientRes, serviceRes] = await Promise.all([
    pool.query(
      `SELECT name, phone, email FROM clients WHERE id = $1 AND organization_id = $2`,
      [appointment.client_id, orgId]
    ),
    pool.query(
      `SELECT name FROM services WHERE id = $1 AND organization_id = $2`,
      [appointment.service_id, orgId]
    ),
  ]);

  const client = clientRes.rows[0];
  const svc = serviceRes.rows[0];
  if (!client || !svc) {
    out.error = "client_or_service_missing";
    return out;
  }

  const when = formatAppointmentWhen(appointment.date, tz);
  const message = `Zdravo ${client.name}, potvrđujemo termin: ${svc.name}, ${when}. Vidimo se!`;

  const smsWanted = Boolean(sendSms);
  const emailWanted = Boolean(sendEmail);
  const queueEnabled = process.env.NOTIFICATIONS_QUEUE_ENABLED !== "false";
  const baseEventId = `booking_confirm:${orgId}:${appointment.id}`;
  const queueOpts = { attempts: 5, backoff: 5000, removeOnComplete: true, removeOnFail: false };

  if (smsWanted) {
    if (!client.phone) {
      out.sms = "skipped_no_phone";
    } else if (!hasSms(twilioOrg)) {
      out.sms = "skipped_not_configured";
    } else {
      try {
        if (queueEnabled) {
          await notificationsQueue.add(
            {
              type: "sms",
              data: {
                eventId: `${baseEventId}:sms`,
                to: client.phone,
                message,
                twilioOverride: twilioOrg,
              },
            },
            { ...queueOpts, jobId: `${baseEventId}:sms` }
          );
          out.sms = "queued";
        } else {
          await sms.sendSMS(client.phone, message, twilioOrg);
          out.sms = "sent";
        }
      } catch (e) {
        console.error("SMS notify failed", e);
        out.sms = "failed";
        out.sms_error = e.message;
      }
    }
  }

  if (sendWhatsApp) {
    if (!client.phone) {
      out.whatsapp = "skipped_no_phone";
    } else if (!hasWhatsApp()) {
      out.whatsapp = "skipped_not_configured";
    } else {
      try {
        const to = whatsappRecipientDigits(client.phone);
        if (!to) {
          out.whatsapp = "skipped_no_phone";
        } else {
          if (queueEnabled) {
            await notificationsQueue.add(
              {
                type: "whatsapp",
                data: {
                  eventId: `${baseEventId}:whatsapp`,
                  to,
                  message,
                },
              },
              { ...queueOpts, jobId: `${baseEventId}:whatsapp` }
            );
            out.whatsapp = "queued";
          } else {
            await whatsapp.sendWhatsApp(to, message);
            out.whatsapp = "sent";
          }
        }
      } catch (e) {
        console.error("WhatsApp notify failed", e);
        out.whatsapp = "failed";
        out.whatsapp_error = e.message;
      }
    }
  }

  if (emailWanted) {
    const to =
      client.email && String(client.email).trim()
        ? String(client.email).trim()
        : null;
    if (!to) {
      out.email = "skipped_no_email";
    } else if (!emailService.isSmtpReady(bn)) {
      out.email = "skipped_not_configured";
    } else {
      try {
        const salonName =
          (orgSettings.branding &&
            orgSettings.branding.display_name &&
            String(orgSettings.branding.display_name).trim()) ||
          "";
        const subj = salonName
          ? `Potvrda termina — ${salonName}`
          : "Potvrda termina";
        const textBody = `${message}\n\n—`;
        const htmlBody = `<p>${message.replace(/\n/g, "<br/>")}</p>`;
        if (queueEnabled) {
          await notificationsQueue.add(
            {
              type: "email",
              data: {
                eventId: `${baseEventId}:email`,
                to,
                subject: subj,
                text: textBody,
                html: htmlBody,
                bookingNotifications: bn,
              },
            },
            { ...queueOpts, jobId: `${baseEventId}:email` }
          );
          out.email = "queued";
        } else {
          await emailService.sendBookingConfirmationEmail(bn, {
            to,
            subject: subj,
            text: textBody,
            html: htmlBody,
          });
          out.email = "sent";
        }
      } catch (e) {
        console.error("Email notify failed", e);
        out.email = "failed";
        out.email_error = e.message;
      }
    }
  }

  return out;
}

function buildReminderMessage(kind, row, orgSettings) {
  const tz = resolveDisplayTimeZone(row);
  const when = formatAppointmentWhen(row.date, tz);
  const timeOnly = formatAppointmentTimeOnly(row.date, tz);
  const hourLabel =
    row.day_before_send_hour != null
      ? String(row.day_before_send_hour)
      : dayBeforeReminderHourLabel();
  const serviceName = row.service_name || "";
  const clientName = row.client_name || "";

  const au = (orgSettings && orgSettings.automation) || {};
  const tpl = au.reminder_template && String(au.reminder_template).trim();
  if (tpl) {
    return tpl
      .replace(/\{ime\}/gi, clientName)
      .replace(/\{vreme\}/gi, timeOnly)
      .replace(/\{datum\}/gi, when)
      .replace(/\{usluga\}/gi, serviceName)
      .replace(/\{sat\}/gi, hourLabel);
  }

  if (kind === "reminder_day_before") {
    return `Podsetnik u ${hourLabel}h: sutra imate termin u ${timeOnly}. Usluga: ${serviceName}. Datum: ${when}.`;
  }
  if (kind === "reminder_24h") {
    return `Podsetnik: imate termin sutra u isto vreme (${when}). Usluga: ${serviceName}.`;
  }
  if (kind === "reminder_2h") {
    return `Podsetnik: imate termin za oko 2 sata (${when}). Usluga: ${serviceName}.`;
  }
  return `Podsetnik: imate termin ${when}. Usluga: ${serviceName}.`;
}

async function processReminderRow(row, kind) {
  const orgSettings = row.org_settings && typeof row.org_settings === "object"
    ? row.org_settings
    : {};
  const message = buildReminderMessage(kind, row, orgSettings);
  const result = await deliverReminderChannels({
    clientPhone: row.client_phone,
    clientEmail: row.client_email,
    message,
    orgSettings,
  });
  if (result.ok) {
    await recordNotificationSent(row.organization_id, row.id, kind);
  }
  return result;
}

async function fetchDueDayBeforeRemindersForOrg(organizationId, timeZone) {
  const res = await pool.query(
    `SELECT a.id, a.organization_id, a.date, a.client_id, a.service_id,
            c.name AS client_name, c.phone AS client_phone, c.email AS client_email,
            s.name AS service_name,
            NULLIF(trim(o.settings->>'timezone'), '') AS org_timezone_setting,
            o.settings AS org_settings
     FROM appointments a
     INNER JOIN organizations o ON o.id = a.organization_id
     INNER JOIN clients c ON c.id = a.client_id AND c.organization_id = a.organization_id
     INNER JOIN services s ON s.id = a.service_id AND s.organization_id = a.organization_id
     WHERE a.organization_id = $1
       AND a.status = 'scheduled'
       AND a.date > NOW()
       AND ${REMINDER_CONTACT_FILTER}
       AND (timezone($2::text, a.date))::date =
           (timezone($2::text, now()))::date + 1
       AND (
         o.settings #>> '{reminders,dayBefore}' IS NULL
         OR o.settings #>> '{reminders,dayBefore}' = 'true'
       )
       AND NOT EXISTS (
         SELECT 1 FROM appointment_notification_log l
         WHERE l.appointment_id = a.id AND l.kind = 'reminder_day_before'
       )`,
    [organizationId, timeZone]
  );
  return res.rows;
}

/**
 * @param {"two_hour"|"twenty_four_hour_custom"} reminderMode
 *   two_hour — podešavanje reminders.twoHoursBefore (podrazumevano uključeno).
 *   twenty_four_hour_custom — šalje se kad je reminders.customReminderHours = 24 (UI „24 h pre“).
 */
async function fetchDueReminders(
  kind,
  startInterval,
  endInterval,
  reminderMode = "two_hour"
) {
  const settingsClause =
    reminderMode === "twenty_four_hour_custom"
      ? `COALESCE(NULLIF(trim(o.settings #>> '{reminders,customReminderHours}'), '')::int, 0) = 24`
      : `(o.settings #>> '{reminders,twoHoursBefore}' IS NULL
          OR o.settings #>> '{reminders,twoHoursBefore}' = 'true')`;

  const res = await pool.query(
    `SELECT a.id, a.organization_id, a.date, a.client_id, a.service_id,
            c.name AS client_name, c.phone AS client_phone, c.email AS client_email,
            s.name AS service_name,
            NULLIF(trim(o.settings->>'timezone'), '') AS org_timezone_setting,
            o.settings AS org_settings
     FROM appointments a
     INNER JOIN organizations o ON o.id = a.organization_id
     INNER JOIN clients c ON c.id = a.client_id AND c.organization_id = a.organization_id
     INNER JOIN services s ON s.id = a.service_id AND s.organization_id = a.organization_id
     WHERE a.status = 'scheduled'
       AND a.date > NOW()
       AND ${REMINDER_CONTACT_FILTER}
       AND a.date BETWEEN NOW() + $2::interval AND NOW() + $3::interval
       AND (${settingsClause})
       AND NOT EXISTS (
         SELECT 1 FROM appointment_notification_log l
         WHERE l.appointment_id = a.id AND l.kind = $1
       )`,
    [kind, startInterval, endInterval]
  );
  return res.rows;
}

async function sendNoShowNotification(orgId, appointment) {
  const kind = "no_show";
  if (await alreadyNotified(appointment.id, kind)) {
    return { ok: false, reason: "already_sent" };
  }

  const orgRes = await pool.query(
    `SELECT settings FROM organizations WHERE id = $1`,
    [orgId]
  );
  const orgSettings = orgRes.rows[0]?.settings || {};
  const rem = orgSettings.reminders || {};
  if (rem.noShowFollowup === false) {
    return { ok: false, reason: "disabled" };
  }

  const clientRes = await pool.query(
    `SELECT name, phone FROM clients WHERE id = $1 AND organization_id = $2`,
    [appointment.client_id, orgId]
  );
  const svcRes = await pool.query(
    `SELECT name FROM services WHERE id = $1 AND organization_id = $2`,
    [appointment.service_id, orgId]
  );

  const client = clientRes.rows[0];
  const svc = svcRes.rows[0];
  if (!client || !svc) {
    return { ok: false, reason: "client_or_service_missing" };
  }

  const tz =
    (orgSettings.timezone && String(orgSettings.timezone).trim()) ||
    defaultAppTimeZone();
  const when = formatAppointmentWhen(appointment.date, tz);
  const message = `Zdravo ${client.name}, niste došli na termin (${when}, ${svc.name}). Želite li novi termin? Odgovorite na ovu poruku.`;

  const bn = orgSettings.booking_notifications || {};
  const twilioOrg = twilioOverrideFromBookingNotifications(bn);
  const result = await sendMessageBestEffort(client.phone, message, twilioOrg);
  if (result.ok) {
    await recordNotificationSent(orgId, appointment.id, kind);
  }
  return result;
}

module.exports = {
  sendBookingNotifications,
  processReminderRow,
  fetchDueReminders,
  fetchDueDayBeforeRemindersForOrg,
  sendNoShowNotification,
  sendMessageBestEffort,
  deliverReminderChannels,
  recordNotificationSent,
};
