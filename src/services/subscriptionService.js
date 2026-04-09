const crypto = require('crypto');
const { isValidRepo, isValidEmail } = require('../utils/validators');
const githubService = require('./githubService');
const emailService = require('./emailService');
const subscriptionRepo = require('../repositories/subscriptionRepository');

/**
 * Subscribe an email to release notifications for a GitHub repository.
 * Validates input, checks the repo exists on GitHub, and prevents duplicates.
 * @param {string} email
 * @param {string} repo - GitHub repository in owner/repo format
 * @returns {Promise<import('../repositories/subscriptionRepository').Subscription>}
 * @throws {Error} 400 if input is invalid, 404 if repo not found, 409 if already subscribed
 */
async function subscribe(email, repo) {
  if (!isValidEmail(email) || !isValidRepo(repo)) {
    const err = new Error('Invalid input');
    err.status = 400;
    throw err;
  }

  const exists = await githubService.checkRepoExists(repo);
  if (!exists) {
    const err = new Error('Repository not found on GitHub');
    err.status = 404;
    throw err;
  }

  const existing = await subscriptionRepo.findByEmailAndRepo(email, repo);
  if (existing) {
    const err = new Error('Email already subscribed to this repository');
    err.status = 409;
    throw err;
  }

  const confirmToken = crypto.randomUUID();
  const unsubscribeToken = crypto.randomUUID();

  const subscription = await subscriptionRepo.create({
    email,
    repo,
    confirmToken,
    unsubscribeToken,
  });

  try {
    await emailService.sendConfirmationEmail(email, repo, confirmToken);
  } catch (error) {
    try {
      await subscriptionRepo.deleteSubscription(subscription.id);
    } catch (rollbackError) {
      error.rollbackError = rollbackError;
    }
    throw error;
  }

  return subscription;
}

/**
 * Confirm a subscription using the token sent in the confirmation email.
 * @param {string} token - The confirmation token (UUID)
 * @returns {Promise<void>}
 * @throws {Error} 400 if token is invalid, 404 if token not found
 */
async function confirmSubscription(token) {
  if (!token || typeof token !== 'string') {
    const err = new Error('Invalid token');
    err.status = 400;
    throw err;
  }

  const subscription = await subscriptionRepo.findByConfirmToken(token);
  if (!subscription) {
    const err = new Error('Token not found');
    err.status = 404;
    throw err;
  }

  await subscriptionRepo.confirmSubscription(subscription.id);
}

/**
 * Unsubscribe from release notifications using the token sent in emails.
 * Permanently deletes the subscription.
 * @param {string} token - The unsubscribe token (UUID)
 * @returns {Promise<void>}
 * @throws {Error} 400 if token is invalid, 404 if token not found
 */
async function unsubscribe(token) {
  if (!token || typeof token !== 'string') {
    const err = new Error('Invalid token');
    err.status = 400;
    throw err;
  }

  const subscription = await subscriptionRepo.findByUnsubscribeToken(token);
  if (!subscription) {
    const err = new Error('Token not found');
    err.status = 404;
    throw err;
  }

  await subscriptionRepo.deleteSubscription(subscription.id);
}

/**
 * Get all confirmed subscriptions for a given email address.
 * @param {string} email
 * @returns {Promise<Array<{email: string, repo: string, confirmed: boolean, last_seen_tag: string|null}>>}
 * @throws {Error} 400 if email is invalid
 */
async function getSubscriptions(email) {
  if (!isValidEmail(email)) {
    const err = new Error('Invalid email');
    err.status = 400;
    throw err;
  }

  return subscriptionRepo.findConfirmedByEmail(email);
}

module.exports = { subscribe, confirmSubscription, unsubscribe, getSubscriptions };
