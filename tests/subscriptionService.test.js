const subscriptionService = require('../src/services/subscriptionService');
const githubService = require('../src/services/githubService');
const emailService = require('../src/services/emailService');
const subscriptionRepo = require('../src/repositories/subscriptionRepository');

jest.mock('../src/services/githubService');
jest.mock('../src/services/emailService');
jest.mock('../src/repositories/subscriptionRepository');

describe('subscriptionService.subscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 400 for invalid repo format', async () => {
    await expect(
      subscriptionService.subscribe('test@example.com', 'invalid')
    ).rejects.toMatchObject({ status: 400 });

    expect(githubService.checkRepoExists).not.toHaveBeenCalled();
  });

  test('returns 400 for invalid email', async () => {
    await expect(
      subscriptionService.subscribe('not-email', 'owner/repo')
    ).rejects.toMatchObject({ status: 400 });
  });

  test('returns 404 when GitHub repo does not exist', async () => {
    githubService.checkRepoExists.mockResolvedValue(false);

    await expect(
      subscriptionService.subscribe('test@example.com', 'owner/nonexistent')
    ).rejects.toMatchObject({ status: 404 });
  });

  test('returns 409 when subscription already exists', async () => {
    githubService.checkRepoExists.mockResolvedValue(true);
    subscriptionRepo.findByEmailAndRepo.mockResolvedValue({ id: 1 });

    await expect(
      subscriptionService.subscribe('test@example.com', 'owner/repo')
    ).rejects.toMatchObject({ status: 409 });
  });

  test('creates subscription and sends confirmation email', async () => {
    githubService.checkRepoExists.mockResolvedValue(true);
    subscriptionRepo.findByEmailAndRepo.mockResolvedValue(null);
    subscriptionRepo.create.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      repo: 'owner/repo',
      confirmed: false,
    });
    emailService.sendConfirmationEmail.mockResolvedValue();

    const result = await subscriptionService.subscribe('test@example.com', 'owner/repo');

    expect(result).toMatchObject({ email: 'test@example.com', repo: 'owner/repo' });
    expect(subscriptionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        repo: 'owner/repo',
        confirmToken: expect.any(String),
        unsubscribeToken: expect.any(String),
      })
    );
    expect(emailService.sendConfirmationEmail).toHaveBeenCalledWith(
      'test@example.com',
      'owner/repo',
      expect.any(String)
    );
  });

  test('rolls back subscription if confirmation email fails', async () => {
    githubService.checkRepoExists.mockResolvedValue(true);
    subscriptionRepo.findByEmailAndRepo.mockResolvedValue(null);
    subscriptionRepo.create.mockResolvedValue({
      id: 42,
      email: 'test@example.com',
      repo: 'owner/repo',
      confirmed: false,
    });
    emailService.sendConfirmationEmail.mockRejectedValue(new Error('SMTP down'));
    subscriptionRepo.deleteSubscription.mockResolvedValue();

    await expect(
      subscriptionService.subscribe('test@example.com', 'owner/repo')
    ).rejects.toThrow('SMTP down');

    expect(subscriptionRepo.deleteSubscription).toHaveBeenCalledWith(42);
  });

  test('propagates GitHub 429 rate limit error', async () => {
    const rateLimitErr = new Error('GitHub rate limit exceeded');
    rateLimitErr.status = 429;
    rateLimitErr.retryAfter = 60;
    githubService.checkRepoExists.mockRejectedValue(rateLimitErr);

    await expect(
      subscriptionService.subscribe('test@example.com', 'owner/repo')
    ).rejects.toMatchObject({ status: 429 });
  });
});
