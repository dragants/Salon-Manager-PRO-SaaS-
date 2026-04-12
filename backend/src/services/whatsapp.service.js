const axios = require("axios");

async function sendWhatsApp(to, message) {
  const phoneId = process.env.WA_PHONE_ID;
  const token = process.env.WA_TOKEN;
  if (!phoneId || !token) {
    const err = new Error("WhatsApp is not configured (WA_PHONE_ID / WA_TOKEN)");
    err.statusCode = 503;
    throw err;
  }

  await axios.post(
    `https://graph.facebook.com/v18.0/${phoneId}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
}

module.exports = { sendWhatsApp };
