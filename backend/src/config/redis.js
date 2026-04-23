const Redis = require("ioredis");

function buildRedisOptions() {
  const url = process.env.REDIS_URL && String(process.env.REDIS_URL).trim();
  if (url) {
    return url;
  }
  return {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  };
}

/**
 * Shared Redis connection (rate limiting, queues, etc.).
 * Can be disabled in dev/test via REDIS_DISABLED=true.
 */
let redis;
function getRedis() {
  if (process.env.REDIS_DISABLED === "true") {
    return null;
  }
  if (!redis) {
    redis = new Redis(buildRedisOptions(), {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: false,
    });
  }
  return redis;
}

module.exports = { getRedis };

