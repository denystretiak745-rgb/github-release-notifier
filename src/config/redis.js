const Redis = require('ioredis');
const env = require('./env');

let client = null;

/**
 * Get or create the Redis client.
 * Returns null if REDIS_URL is not configured.
 * @returns {import('ioredis').Redis|null}
 */
function getClient() {
  if (client) return client;
  if (!env.redisUrl) return null;

  client = new Redis(env.redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  client.on('error', () => {});

  client.connect().catch(() => {});
  return client;
}

/** @param {import('ioredis').Redis|null} mock */
function setClient(mock) {
  client = mock;
}

module.exports = { getClient, setClient };
