const twilio = require("twilio");

function getClient() {
  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_TOKEN;
  if (!sid || !token) {
    const err = new Error("Twilio is not configured (TWILIO_SID / TWILIO_TOKEN)");
    err.statusCode = 503;
    throw err;
  }
  return twilio(sid, token);
}

/**
 * @param {string} to
 * @param {string} message
 * @param {{ accountSid: string, authToken: string, from: string } | null} override iz organizations.settings.booking_notifications
 */
async function sendSMS(to, message, override = null) {
  let client;
  let from;

  if (
    override &&
    override.accountSid &&
    override.authToken &&
    override.from
  ) {
    client = twilio(override.accountSid, override.authToken);
    from = override.from;
  } else {
    from = process.env.TWILIO_PHONE;
    if (!from) {
      const err = new Error("Twilio is not configured (TWILIO_PHONE)");
      err.statusCode = 503;
      throw err;
    }
    client = getClient();
  }

  return client.messages.create({
    body: message,
    from,
    to,
  });
}

module.exports = { sendSMS };
