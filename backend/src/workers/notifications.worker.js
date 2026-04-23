/**
 * Dedicated queue worker process (PM2).
 * Runs Bull processors for background notifications.
 */

const path = require("path");

// Load backend env (DATABASE_URL, TWILIO, etc.) + allow REDIS_* too.
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const queue = require("../../../queue/notifications");
const sms = require("../services/sms.service");
const whatsapp = require("../services/whatsapp.service");
const emailService = require("../services/email.service");

function whatsappRecipientDigits(phone) {
  return String(phone).replace(/\D/g, "");
}

queue.on("ready", () => {
  console.log("[worker] notifications queue ready");
});

queue.on("error", (err) => {
  console.error("[worker] notifications queue error:", err?.message || err);
});

queue.on("failed", (job, err) => {
  console.error(
    "[worker] job failed:",
    job?.id,
    job?.data?.type,
    err?.message || err
  );
});

queue.process(async (job) => {
  const { type, data } = job.data || {};

  if (type === "sms") {
    const to = data?.to;
    const message = data?.message;
    const twilioOverride = data?.twilioOverride ?? null;
    if (!to || !message) {
      throw new Error("sms job missing to/message");
    }
    await sms.sendSMS(String(to), String(message), twilioOverride);
    return { ok: true };
  }

  if (type === "whatsapp") {
    const toRaw = data?.to;
    const message = data?.message;
    if (!toRaw || !message) {
      throw new Error("whatsapp job missing to/message");
    }
    const to = whatsappRecipientDigits(String(toRaw));
    if (!to) {
      throw new Error("whatsapp job invalid to");
    }
    await whatsapp.sendWhatsApp(to, String(message));
    return { ok: true };
  }

  if (type === "email") {
    const bn = data?.bookingNotifications ?? {};
    const to = data?.to;
    const subject = data?.subject;
    const text = data?.text;
    const html = data?.html;
    if (!to || !subject || !text || !html) {
      throw new Error("email job missing to/subject/text/html");
    }
    await emailService.sendBookingConfirmationEmail(bn, {
      to: String(to),
      subject: String(subject),
      text: String(text),
      html: String(html),
    });
    return { ok: true };
  }

  throw new Error(`Unknown notification type: ${type}`);
});

console.log("[worker] notifications worker started (Bull).");

