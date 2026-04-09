const releaseScanner = require('../src/services/releaseScanner');
const subscriptionRepo = require('../src/repositories/subscriptionRepository');
const githubService = require('../src/services/githubService');
const emailService = require('../src/services/emailService');

jest.mock('../src/repositories/subscriptionRepository');
jest.mock('../src/services/githubService');
jest.mock('../src/services/emailService');

describe('releaseScanner.scan', () => {
  beforeEach(() => jest.clearAllMocks());

  test('does nothing when no confirmed subscriptions exist', async () => {
    subscriptionRepo.findAllConfirmed.mockResolvedValue([]);

    await releaseScanner.scan();

    expect(githubService.getLatestRelease).not.toHaveBeenCalled();
  });

  test('sends notification and updates tag when new release found', async () => {
    subscriptionRepo.findAllConfirmed.mockResolvedValue([
      { id: 1, email: 'a@test.com', repo: 'owner/repo', last_seen_tag: 'v1.0.0', unsubscribe_token: 'tok-1' },
    ]);
    githubService.getLatestRelease.mockResolvedValue({
      tag_name: 'v2.0.0',
      html_url: 'https://github.com/owner/repo/releases/tag/v2.0.0',
    });
    emailService.sendReleaseNotification.mockResolvedValue();
    subscriptionRepo.updateLastSeenTag.mockResolvedValue();

    await releaseScanner.scan();

    expect(githubService.getLatestRelease).toHaveBeenCalledWith('owner/repo');
    expect(emailService.sendReleaseNotification).toHaveBeenCalledWith(
      'a@test.com', 'owner/repo', 'v2.0.0',
      'https://github.com/owner/repo/releases/tag/v2.0.0', 'tok-1'
    );
    expect(subscriptionRepo.updateLastSeenTag).toHaveBeenCalledWith(1, 'v2.0.0');
  });

  test('skips notification when tag matches last_seen_tag', async () => {
    subscriptionRepo.findAllConfirmed.mockResolvedValue([
      { id: 1, email: 'a@test.com', repo: 'owner/repo', last_seen_tag: 'v1.0.0', unsubscribe_token: 'tok-1' },
    ]);
    githubService.getLatestRelease.mockResolvedValue({
      tag_name: 'v1.0.0',
      html_url: 'https://github.com/owner/repo/releases/tag/v1.0.0',
    });

    await releaseScanner.scan();

    expect(emailService.sendReleaseNotification).not.toHaveBeenCalled();
    expect(subscriptionRepo.updateLastSeenTag).not.toHaveBeenCalled();
  });

  test('deduplicates GitHub API calls for same repo', async () => {
    subscriptionRepo.findAllConfirmed.mockResolvedValue([
      { id: 1, email: 'a@test.com', repo: 'owner/repo', last_seen_tag: null, unsubscribe_token: 'tok-1' },
      { id: 2, email: 'b@test.com', repo: 'owner/repo', last_seen_tag: null, unsubscribe_token: 'tok-2' },
    ]);
    githubService.getLatestRelease.mockResolvedValue({
      tag_name: 'v1.0.0',
      html_url: 'https://github.com/owner/repo/releases/tag/v1.0.0',
    });
    emailService.sendReleaseNotification.mockResolvedValue();
    subscriptionRepo.updateLastSeenTag.mockResolvedValue();

    await releaseScanner.scan();

    expect(githubService.getLatestRelease).toHaveBeenCalledTimes(1);
    expect(emailService.sendReleaseNotification).toHaveBeenCalledTimes(2);
  });

  test('skips repo when no releases exist (404)', async () => {
    subscriptionRepo.findAllConfirmed.mockResolvedValue([
      { id: 1, email: 'a@test.com', repo: 'owner/repo', last_seen_tag: null, unsubscribe_token: 'tok-1' },
    ]);
    githubService.getLatestRelease.mockResolvedValue(null);

    await releaseScanner.scan();

    expect(emailService.sendReleaseNotification).not.toHaveBeenCalled();
  });

  test('continues scanning other repos when one email fails', async () => {
    subscriptionRepo.findAllConfirmed.mockResolvedValue([
      { id: 1, email: 'fail@test.com', repo: 'owner/repo', last_seen_tag: null, unsubscribe_token: 'tok-1' },
      { id: 2, email: 'ok@test.com', repo: 'owner/repo', last_seen_tag: null, unsubscribe_token: 'tok-2' },
    ]);
    githubService.getLatestRelease.mockResolvedValue({
      tag_name: 'v1.0.0',
      html_url: 'https://github.com/owner/repo/releases/tag/v1.0.0',
    });
    emailService.sendReleaseNotification
      .mockRejectedValueOnce(new Error('SMTP error'))
      .mockResolvedValueOnce();
    subscriptionRepo.updateLastSeenTag.mockResolvedValue();

    await releaseScanner.scan();

    expect(emailService.sendReleaseNotification).toHaveBeenCalledTimes(2);
    expect(subscriptionRepo.updateLastSeenTag).toHaveBeenCalledTimes(1);
    expect(subscriptionRepo.updateLastSeenTag).toHaveBeenCalledWith(2, 'v1.0.0');
  });

  test('handles GitHub 429 rate limit and continues scanning', async () => {
    subscriptionRepo.findAllConfirmed.mockResolvedValue([
      { id: 1, email: 'a@test.com', repo: 'owner/repo1', last_seen_tag: null, unsubscribe_token: 'tok-1' },
      { id: 2, email: 'b@test.com', repo: 'owner/repo2', last_seen_tag: null, unsubscribe_token: 'tok-2' },
    ]);
    const rateLimitErr = new Error('GitHub rate limit exceeded');
    rateLimitErr.status = 429;
    rateLimitErr.retryAfter = 0;
    githubService.getLatestRelease
      .mockRejectedValueOnce(rateLimitErr)
      .mockResolvedValueOnce({ tag_name: 'v1.0.0', html_url: 'https://github.com/owner/repo2/releases/tag/v1.0.0' });
    emailService.sendReleaseNotification.mockResolvedValue();
    subscriptionRepo.updateLastSeenTag.mockResolvedValue();

    await releaseScanner.scan();

    expect(githubService.getLatestRelease).toHaveBeenCalledTimes(2);
    expect(emailService.sendReleaseNotification).toHaveBeenCalledTimes(1);
  });

  test('notifies on first scan when last_seen_tag is null', async () => {
    subscriptionRepo.findAllConfirmed.mockResolvedValue([
      { id: 1, email: 'a@test.com', repo: 'owner/repo', last_seen_tag: null, unsubscribe_token: 'tok-1' },
    ]);
    githubService.getLatestRelease.mockResolvedValue({
      tag_name: 'v3.0.0',
      html_url: 'https://github.com/owner/repo/releases/tag/v3.0.0',
    });
    emailService.sendReleaseNotification.mockResolvedValue();
    subscriptionRepo.updateLastSeenTag.mockResolvedValue();

    await releaseScanner.scan();

    expect(emailService.sendReleaseNotification).toHaveBeenCalledTimes(1);
    expect(subscriptionRepo.updateLastSeenTag).toHaveBeenCalledWith(1, 'v3.0.0');
  });
});
