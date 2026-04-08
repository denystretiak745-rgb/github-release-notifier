const request = require('supertest');
const app = require('../src/app');
const subscriptionService = require('../src/services/subscriptionService');

jest.mock('../src/services/subscriptionService');

describe('GET /api/subscriptions', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with list of subscriptions', async () => {
    const mockSubs = [
      { email: 'user@example.com', repo: 'owner/repo1', confirmed: true, last_seen_tag: 'v1.0.0' },
      { email: 'user@example.com', repo: 'owner/repo2', confirmed: true, last_seen_tag: null },
    ];
    subscriptionService.getSubscriptions.mockResolvedValue(mockSubs);

    const res = await request(app).get('/api/subscriptions?email=user@example.com');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockSubs);
    expect(subscriptionService.getSubscriptions).toHaveBeenCalledWith('user@example.com');
  });

  test('returns 200 with empty array when no subscriptions', async () => {
    subscriptionService.getSubscriptions.mockResolvedValue([]);

    const res = await request(app).get('/api/subscriptions?email=nobody@example.com');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns 400 for invalid email', async () => {
    const err = new Error('Invalid email');
    err.status = 400;
    subscriptionService.getSubscriptions.mockRejectedValue(err);

    const res = await request(app).get('/api/subscriptions?email=bad');

    expect(res.status).toBe(400);
  });

  test('returns 400 when email query param is missing', async () => {
    const err = new Error('Invalid email');
    err.status = 400;
    subscriptionService.getSubscriptions.mockRejectedValue(err);

    const res = await request(app).get('/api/subscriptions');

    expect(res.status).toBe(400);
  });
});
