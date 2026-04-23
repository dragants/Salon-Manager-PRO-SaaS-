const RedisStore = require("rate-limit-redis");
const { getRedis } = require("../config/redis");

function redisStoreOrNull(prefix) {
  const redis = getRedis();
  if (!redis) {
    return null;
  }
  // rate-limit-redis expects node-redis style call signature. ioredis supports it via sendCommand.
  return new RedisStore({
    prefix: prefix ? `${prefix}:` : "rl:",
    sendCommand: (...args) => redis.call(...args),
  });
}

module.exports = { redisStoreOrNull };

