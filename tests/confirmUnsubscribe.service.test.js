const subscriptionService = require('../src/services/subscriptionService');
const subscriptionRepo = require('../src/repositories/subscriptionRepository');

jest.mock('../src/repositories/subscriptionRepository');

describe('subscriptionService.confirmSubscription', () => {
  beforeEach(() => jest.clearAllMocks());

  test('confirms subscription when token is valid', async () => {
    subscriptionRepo.findByConfirmToken.mockResolvedValue({ id: 1, confirmed: false });
    subscriptionRepo.confirmSubscription.mockResolvedValue();

    await subscriptionService.confirmSubscription('valid-token');

    expect(subscriptionRepo.findByConfirmToken).toHaveBeenCalledWith('valid-token');
    expect(subscriptionRepo.confirmSubscription).toHaveBeenCalledWith(1);
  });

  test('throws 404 when confirm token not found', async () => {
    subscriptionRepo.findByConfirmToken.mockResolvedValue(null);

    await expect(
      subscriptionService.confirmSubscription('nonexistent-token')
    ).rejects.toMatchObject({ status: 404, message: 'Token not found' });
  });

  test('throws 400 when token is empty', async () => {
    await expect(
      subscriptionService.confirmSubscription('')
    ).rejects.toMatchObject({ status: 400, message: 'Invalid token' });
  });

  test('throws 400 when token is null', async () => {
    await expect(
      subscriptionService.confirmSubscription(null)
    ).rejects.toMatchObject({ status: 400, message: 'Invalid token' });
  });
});

describe('subscriptionService.unsubscribe', () => {
  beforeEach(() => jest.clearAllMocks());

  test('deletes subscription when token is valid', async () => {
    subscriptionRepo.findByUnsubscribeToken.mockResolvedValue({ id: 5 });
    subscriptionRepo.deleteSubscription.mockResolvedValue();

    await subscriptionService.unsubscribe('valid-unsub-token');

    expect(subscriptionRepo.findByUnsubscribeToken).toHaveBeenCalledWith('valid-unsub-token');
    expect(subscriptionRepo.deleteSubscription).toHaveBeenCalledWith(5);
  });

  test('throws 404 when unsubscribe token not found', async () => {
    subscriptionRepo.findByUnsubscribeToken.mockResolvedValue(null);

    await expect(
      subscriptionService.unsubscribe('nonexistent-token')
    ).rejects.toMatchObject({ status: 404, message: 'Token not found' });
  });

  test('throws 400 when token is empty', async () => {
    await expect(
      subscriptionService.unsubscribe('')
    ).rejects.toMatchObject({ status: 400, message: 'Invalid token' });
  });

  test('throws 400 when token is null', async () => {
    await expect(
      subscriptionService.unsubscribe(null)
    ).rejects.toMatchObject({ status: 400, message: 'Invalid token' });
  });
});
