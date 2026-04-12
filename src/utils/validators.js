const REPO_REGEX = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
const GITHUB_URL_REGEX = /^https?:\/\/github\.com\/([a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+)\/?$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Extract owner/repo from a plain "owner/repo" string or a GitHub URL.
 * Returns the normalized "owner/repo" string, or null if the input is invalid.
 * @param {string} input
 * @returns {string|null}
 */
function parseRepo(input) {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();

  if (REPO_REGEX.test(trimmed)) return trimmed;

  const urlMatch = trimmed.match(GITHUB_URL_REGEX);
  if (urlMatch) return urlMatch[1];

  return null;
}

function isValidRepo(repo) {
  return parseRepo(repo) !== null;
}

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email);
}

module.exports = { isValidRepo, isValidEmail, parseRepo };
