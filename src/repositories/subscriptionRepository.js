const db = require('../config/db');

/**
 * @typedef {Object} Subscription
 * @property {number} id
 * @property {string} email
 * @property {string} repo - GitHub repository in owner/repo format
 * @property {boolean} confirmed
 * @property {string} confirm_token
 * @property {string} unsubscribe_token
 * @property {string|null} last_seen_tag
 * @property {Date} created_at
 */

/**
 * Find a subscription by email and repository combination.
 * @param {string} email
 * @param {string} repo - GitHub repository in owner/repo format
 * @returns {Promise<Subscription|null>}
 */
async function findByEmailAndRepo(email, repo) {
  const { rows } = await db.query(
    'SELECT * FROM subscriptions WHERE email = $1 AND repo = $2',
    [email, repo]
  );
  return rows[0] || null;
}

/**
 * Create a new subscription record.
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.repo - GitHub repository in owner/repo format
 * @param {string} params.confirmToken - UUID token for email confirmation
 * @param {string} params.unsubscribeToken - UUID token for one-click unsubscribe
 * @returns {Promise<Subscription>}
 */
async function create({ email, repo, confirmToken, unsubscribeToken }) {
  const { rows } = await db.query(
    `INSERT INTO subscriptions (email, repo, confirm_token, unsubscribe_token)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [email, repo, confirmToken, unsubscribeToken]
  );
  return rows[0];
}

/**
 * Find a subscription by its confirmation token.
 * @param {string} token
 * @returns {Promise<Subscription|null>}
 */
async function findByConfirmToken(token) {
  const { rows } = await db.query(
    'SELECT * FROM subscriptions WHERE confirm_token = $1',
    [token]
  );
  return rows[0] || null;
}

/**
 * Find a subscription by its unsubscribe token.
 * @param {string} token
 * @returns {Promise<Subscription|null>}
 */
async function findByUnsubscribeToken(token) {
  const { rows } = await db.query(
    'SELECT * FROM subscriptions WHERE unsubscribe_token = $1',
    [token]
  );
  return rows[0] || null;
}

/**
 * Mark a subscription as confirmed.
 * @param {number} id - Subscription ID
 * @returns {Promise<void>}
 */
async function confirmSubscription(id) {
  await db.query(
    'UPDATE subscriptions SET confirmed = TRUE WHERE id = $1',
    [id]
  );
}

/**
 * Delete a subscription record permanently.
 * @param {number} id - Subscription ID
 * @returns {Promise<void>}
 */
async function deleteSubscription(id) {
  await db.query('DELETE FROM subscriptions WHERE id = $1', [id]);
}

/**
 * Find all confirmed subscriptions for a given email.
 * @param {string} email
 * @returns {Promise<Array<{email: string, repo: string, confirmed: boolean, unsubscribe_token: string, last_seen_tag: string|null}>>}
 */
async function findConfirmedByEmail(email) {
  const { rows } = await db.query(
    'SELECT email, repo, confirmed, unsubscribe_token, last_seen_tag FROM subscriptions WHERE email = $1 AND confirmed = TRUE',
    [email]
  );
  return rows;
}

/**
 * Find all confirmed subscriptions across all users.
 * Used by the release scanner to check for new releases.
 * @returns {Promise<Subscription[]>}
 */
async function findAllConfirmed() {
  const { rows } = await db.query(
    'SELECT * FROM subscriptions WHERE confirmed = TRUE'
  );
  return rows;
}

/**
 * Update the last seen release tag for a subscription.
 * @param {number} id - Subscription ID
 * @param {string} tag - The latest release tag name
 * @returns {Promise<void>}
 */
async function updateLastSeenTag(id, tag) {
  await db.query(
    'UPDATE subscriptions SET last_seen_tag = $1 WHERE id = $2',
    [tag, id]
  );
}

module.exports = {
  findByEmailAndRepo,
  create,
  findByConfirmToken,
  findByUnsubscribeToken,
  confirmSubscription,
  deleteSubscription,
  findConfirmedByEmail,
  findAllConfirmed,
  updateLastSeenTag,
};
