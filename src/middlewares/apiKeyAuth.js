const env = require('../config/env');

const EXEMPT_PATTERNS = [
  /^\/confirm\//,
  /^\/unsubscribe\//,
];

/**
 * API key authentication middleware.
 * If API_KEYS is configured, requires a valid X-API-Key header.
 * If API_KEYS is empty/not set, all requests pass through (backward compatible).
 * Confirm and unsubscribe routes are always exempt (accessed via email links).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function apiKeyAuth(req, res, next) {
  if (env.apiKeys.length === 0) {
    return next();
  }

  if (EXEMPT_PATTERNS.some((pattern) => pattern.test(req.path))) {
    return next();
  }

  const key = (req.get('X-API-Key') || '').trim();

  if (!key) {
    return res.status(401).json({ message: 'API key required' });
  }

  if (!env.apiKeys.includes(key)) {
    return res.status(403).json({ message: 'Invalid API key' });
  }

  next();
}

module.exports = apiKeyAuth;
