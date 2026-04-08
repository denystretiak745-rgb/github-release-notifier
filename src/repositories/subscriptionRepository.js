const db = require('../config/db');

async function findByEmailAndRepo(email, repo) {
  const { rows } = await db.query(
    'SELECT * FROM subscriptions WHERE email = $1 AND repo = $2',
    [email, repo]
  );
  return rows[0] || null;
}

async function create({ email, repo, confirmToken, unsubscribeToken }) {
  const { rows } = await db.query(
    `INSERT INTO subscriptions (email, repo, confirm_token, unsubscribe_token)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [email, repo, confirmToken, unsubscribeToken]
  );
  return rows[0];
}

async function findByConfirmToken(token) {
  const { rows } = await db.query(
    'SELECT * FROM subscriptions WHERE confirm_token = $1',
    [token]
  );
  return rows[0] || null;
}

async function findByUnsubscribeToken(token) {
  const { rows } = await db.query(
    'SELECT * FROM subscriptions WHERE unsubscribe_token = $1',
    [token]
  );
  return rows[0] || null;
}

async function confirmSubscription(id) {
  await db.query(
    'UPDATE subscriptions SET confirmed = TRUE WHERE id = $1',
    [id]
  );
}

async function deleteSubscription(id) {
  await db.query('DELETE FROM subscriptions WHERE id = $1', [id]);
}

async function findConfirmedByEmail(email) {
  const { rows } = await db.query(
    'SELECT email, repo, confirmed, last_seen_tag FROM subscriptions WHERE email = $1 AND confirmed = TRUE',
    [email]
  );
  return rows;
}

async function findAllConfirmed() {
  const { rows } = await db.query(
    'SELECT * FROM subscriptions WHERE confirmed = TRUE'
  );
  return rows;
}

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
