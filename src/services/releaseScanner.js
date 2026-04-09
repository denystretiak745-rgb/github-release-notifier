const subscriptionRepo = require('../repositories/subscriptionRepository');
const githubService = require('./githubService');
const emailService = require('./emailService');
const env = require('../config/env');

let intervalId = null;

/**
 * Scan all confirmed subscriptions for new releases.
 * Deduplicates GitHub API calls — fetches each repo only once per cycle.
 * On new release: sends notification email and updates last_seen_tag.
 * @returns {Promise<void>}
 */
async function scan() {
  const subscriptions = await subscriptionRepo.findAllConfirmed();

  if (subscriptions.length === 0) return;

  const repoMap = new Map();
  for (const sub of subscriptions) {
    if (!repoMap.has(sub.repo)) {
      repoMap.set(sub.repo, []);
    }
    repoMap.get(sub.repo).push(sub);
  }

  for (const [repo, subs] of repoMap) {
    try {
      const release = await githubService.getLatestRelease(repo);

      if (!release || !release.tag_name) continue;

      for (const sub of subs) {
        if (sub.last_seen_tag === release.tag_name) continue;

        try {
          await emailService.sendReleaseNotification(
            sub.email,
            repo,
            release.tag_name,
            release.html_url,
            sub.unsubscribe_token
          );
          await subscriptionRepo.updateLastSeenTag(sub.id, release.tag_name);
        } catch (emailErr) {
          console.error(`Failed to notify ${sub.email} for ${repo}:`, emailErr.message);
        }
      }
    } catch (err) {
      if (err.status === 429) {
        const waitMs = (err.retryAfter ?? 60) * 1000;
        console.warn(`GitHub rate limit hit. Pausing scanner for ${waitMs / 1000}s`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      } else {
        console.error(`Failed to check releases for ${repo}:`, err.message);
      }
    }
  }
}

/**
 * Start the background release scanner on a fixed interval.
 * @returns {void}
 */
function start() {
  if (intervalId) return;

  console.log(`Release scanner started (interval: ${env.scanIntervalMs}ms)`);

  scan().catch((err) => console.error('Initial scan failed:', err.message));

  intervalId = setInterval(() => {
    scan().catch((err) => console.error('Scan cycle failed:', err.message));
  }, env.scanIntervalMs);
}

/**
 * Stop the background release scanner.
 * @returns {void}
 */
function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

module.exports = { scan, start, stop };
