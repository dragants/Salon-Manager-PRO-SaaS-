const nodemailer = require("nodemailer");
const env = require("../config/env");

function appSmtpReady() {
  const h = env.APP_SMTP_HOST && String(env.APP_SMTP_HOST).trim();
  const u = env.APP_SMTP_USER && String(env.APP_SMTP_USER).trim();
  const p = env.APP_SMTP_PASS != null && String(env.APP_SMTP_PASS).trim();
  const f = env.APP_SMTP_FROM && String(env.APP_SMTP_FROM).trim();
  return Boolean(h && u && p && f);
}

/**
 * @param {string} to
 * @param {string} resetLink
 */
async function sendPasswordResetEmail(to, resetLink) {
  if (!appSmtpReady()) {
    // eslint-disable-next-line no-console
    console.warn(
      "[auth] APP_SMTP_* nije podešen — reset link (samo dev):\n",
      resetLink
    );
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: String(env.APP_SMTP_HOST).trim(),
    port: env.APP_SMTP_PORT,
    secure: env.APP_SMTP_SECURE,
    auth: {
      user: String(env.APP_SMTP_USER).trim(),
      pass: String(env.APP_SMTP_PASS).trim(),
    },
  });

  const from = String(env.APP_SMTP_FROM).trim();
  await transporter.sendMail({
    from,
    to,
    subject: "Reset lozinke — Salon Manager PRO",
    text: `Zatražili ste novu lozinku. Otvorite link (važi 1 sat):\n\n${resetLink}\n\nAko niste vi, ignorišite ovu poruku.`,
    html: `<p>Zatražili ste novu lozinku.</p><p><a href="${resetLink}">Postavi novu lozinku</a> (važi 1 sat).</p><p>Ako niste vi, ignorišite ovu poruku.</p>`,
  });
  return true;
}

module.exports = { sendPasswordResetEmail, appSmtpReady };
