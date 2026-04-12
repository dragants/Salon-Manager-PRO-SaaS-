const nodemailer = require("nodemailer");

function smtpConfigFromBookingNotifications(bn) {
  const s = bn && bn.smtp;
  if (!s || typeof s !== "object") {
    return null;
  }
  const host = s.host && String(s.host).trim();
  const user = s.user && String(s.user).trim();
  const pass = s.password != null ? String(s.password) : "";
  const from = s.from_email && String(s.from_email).trim();
  if (!host || !user || !pass.trim() || !from) {
    return null;
  }
  const port = Number(s.port) > 0 ? Number(s.port) : 587;
  const secure = Boolean(s.secure);
  return {
    host,
    port,
    secure,
    auth: { user, pass },
    fromEmail: from,
    fromName: (s.from_name && String(s.from_name).trim()) || "",
  };
}

function isSmtpReady(bn) {
  return smtpConfigFromBookingNotifications(bn) != null;
}

async function sendBookingConfirmationEmail(bn, { to, subject, text, html }) {
  const cfg = smtpConfigFromBookingNotifications(bn);
  if (!cfg) {
    const err = new Error("SMTP nije potpuno podešen.");
    err.statusCode = 503;
    throw err;
  }
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.auth,
  });

  const from =
    cfg.fromName && cfg.fromName.length > 0
      ? `"${cfg.fromName.replace(/"/g, "")}" <${cfg.fromEmail}>`
      : cfg.fromEmail;

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html: html || undefined,
  });
}

module.exports = {
  isSmtpReady,
  sendBookingConfirmationEmail,
};
