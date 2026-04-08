const subscriptionService = require('../src/services/subscriptionService');
const subscriptionRepo = require('../src/repositories/subscriptionRepository');

jest.mock('../src/repositories/subscriptionRepository');

describe('subscriptionService.getSubscriptions', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns confirmed subscriptions for a valid email', async () => {
    const mockSubs = [
      { email: 'user@example.com', repo: 'owner/repo1', confirmed: true, last_seen_tag: 'v1.0.0' },
      { email: 'user@example.com', repo: 'owner/repo2', confirmed: true, last_seen_tag: null },
    ];
    subscriptionRepo.findConfirmedByEmail.mockResolvedValue(mockSubs);

    const result = await subscriptionService.getSubscriptions('user@example.com');

    expect(result).toEqual(mockSubs);
    expect(subscriptionRepo.findConfirmedByEmail).toHaveBeenCalledWith('user@example.com');
  });

  test('returns empty array when no subscriptions exist', async () => {
    subscriptionRepo.findConfirmedByEmail.mockResolvedValue([]);

    const result = await subscriptionService.getSubscriptions('nobody@example.com');

    expect(result).toEqual([]);
  });

  test('throws 400 for invalid email', async () => {
    await expect(
      subscriptionService.getSubscriptions('not-an-email')
    ).rejects.toMatchObject({ status: 400, message: 'Invalid email' });

    expect(subscriptionRepo.findConfirmedByEmail).not.toHaveBeenCalled();
  });

  test('throws 400 for empty email', async () => {
    await expect(
      subscriptionService.getSubscriptions('')
    ).rejects.toMatchObject({ status: 400 });
  });

  test('throws 400 for undefined email', async () => {
    await expect(
      subscriptionService.getSubscriptions(undefined)
    ).rejects.toMatchObject({ status: 400 });
  });
});
