// src/lib/redis.js
const IORedis = require('ioredis');

/**
 * Creates a BullMQ-compatible Redis connection (supports Upstash TLS rediss:// URLs
 * as well as local redis:// URLs).
 */
function createRedisConnection() {
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
  if (!redisUrl) {
    throw new Error('Missing REDIS_URL (or UPSTASH_REDIS_URL) environment variable.');
  }

  const isTls = redisUrl.startsWith('rediss://');

  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
  });
}

const globalForRedis = globalThis;

function getRedisConnection() {
  if (!globalForRedis.__bullmqRedis) {
    globalForRedis.__bullmqRedis = createRedisConnection();
  }
  return globalForRedis.__bullmqRedis;
}

module.exports = { createRedisConnection, getRedisConnection };
