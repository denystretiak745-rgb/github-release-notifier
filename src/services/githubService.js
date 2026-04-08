const env = require('../config/env');

async function checkRepoExists(repo) {
  const headers = { 'Accept': 'application/vnd.github.v3+json' };
  if (env.githubToken) {
    headers['Authorization'] = `token ${env.githubToken}`;
  }

  const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });

  if (res.status === 200) return true;
  if (res.status === 404) return false;

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
  const headers = { 'Accept': 'application/vnd.github.v3+json' };
  if (env.githubToken) {
    headers['Authorization'] = `token ${env.githubToken}`;
  }

  const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers });

  if (res.status === 200) {
    return await res.json();
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
