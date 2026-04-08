const crypto = require('crypto');
const { isValidRepo, isValidEmail } = require('../utils/validators');
const githubService = require('./githubService');
const subscriptionRepo = require('../repositories/subscriptionRepository');

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

  return subscription;
}

module.exports = { subscribe };
