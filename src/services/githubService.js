const env = require('../config/env');
const { getClient } = require('../config/redis');

const CACHE_TTL = 600; // 10 minutes

/**
 * Get a cached value from Redis.
 * Returns null on miss or if Redis is unavailable.
 * @param {string} key
 * @returns {Promise<string|null>}
 */
async function cacheGet(key) {
  const redis = getClient();
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

/**
 * Set a cached value in Redis with TTL.
 * Silently fails if Redis is unavailable.
 * @param {string} key
 * @param {string} value
 * @returns {Promise<void>}
 */
async function cacheSet(key, value) {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.set(key, value, 'EX', CACHE_TTL);
  } catch {
    // cache write failure is non-critical
  }
}

async function checkRepoExists(repo) {
  const cacheKey = `repo:exists:${repo}`;
  const cached = await cacheGet(cacheKey);
  if (cached === 'true') return true;
  if (cached === 'false') return false;

  const headers = { 'Accept': 'application/vnd.github.v3+json' };
  if (env.githubToken) {
    headers['Authorization'] = `token ${env.githubToken}`;
  }

  const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });

  if (res.status === 200) {
    await cacheSet(cacheKey, 'true');
    return true;
  }
  if (res.status === 404) {
    await cacheSet(cacheKey, 'false');
    return false;
  }

  if (res.status === 429) {
    const retryAfter = res.headers.get('retry-after');
    const err = new Error('GitHub rate limit exceeded');
    err.status = 429;
    err.retryAfter = retryAfter ? parseInt(retryAfter, 10) : 60;
    throw err;
  }

  throw new Error(`GitHub API returned status ${res.status}`);
}

async function getLatestRelease(repo) {
  const cacheKey = `repo:release:${repo}`;
  const cached = await cacheGet(cacheKey);
  if (cached !== null) {
    try {
      return JSON.parse(cached);
    } catch {
      // corrupted cache entry, fetch fresh
    }
  }

  const headers = { 'Accept': 'application/vnd.github.v3+json' };
  if (env.githubToken) {
    headers['Authorization'] = `token ${env.githubToken}`;
  }

  const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers });

  if (res.status === 200) {
    const data = await res.json();
    await cacheSet(cacheKey, JSON.stringify(data));
    return data;
  }

  if (res.status === 404) return null;

  if (res.status === 429) {
    const retryAfter = res.headers.get('retry-after');
    const err = new Error('GitHub rate limit exceeded');
    err.status = 429;
    err.retryAfter = retryAfter ? parseInt(retryAfter, 10) : 60;
    throw err;
  }

  throw new Error(`GitHub API returned status ${res.status}`);
}

module.exports = { checkRepoExists, getLatestRelease };
