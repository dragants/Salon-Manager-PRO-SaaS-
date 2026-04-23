const Queue = require("bull");

/**
 * Notifications queue (SMS / WhatsApp / Email…).
 *
 * Requires Redis.
 * Env (optional):
 *  - REDIS_HOST (default 127.0.0.1)
 *  - REDIS_PORT (default 6379)
 *  - REDIS_PASSWORD (optional)
 */

const queue = new Queue("notifications", {
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
});

module.exports = queue;

