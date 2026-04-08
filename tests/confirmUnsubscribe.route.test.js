const request = require('supertest');
const app = require('../src/app');
const subscriptionService = require('../src/services/subscriptionService');

jest.mock('../src/services/subscriptionService');

describe('GET /api/confirm/:token', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 when token is valid', async () => {
    subscriptionService.confirmSubscription.mockResolvedValue();

    const res = await request(app).get('/api/confirm/valid-token');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Subscription confirmed successfully');
    expect(subscriptionService.confirmSubscription).toHaveBeenCalledWith('valid-token');
  });

  test('returns 404 when token not found', async () => {
    const err = new Error('Token not found');
    err.status = 404;
    subscriptionService.confirmSubscription.mockRejectedValue(err);

    const res = await request(app).get('/api/confirm/bad-token');

    expect(res.status).toBe(404);
  });

  test('returns 400 when token is invalid', async () => {
    const err = new Error('Invalid token');
    err.status = 400;
    subscriptionService.confirmSubscription.mockRejectedValue(err);

    const res = await request(app).get('/api/confirm/bad');

    expect(res.status).toBe(400);
  });
});

describe('GET /api/unsubscribe/:token', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 when token is valid', async () => {
    subscriptionService.unsubscribe.mockResolvedValue();

    const res = await request(app).get('/api/unsubscribe/valid-token');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Unsubscribed successfully');
    expect(subscriptionService.unsubscribe).toHaveBeenCalledWith('valid-token');
  });

  test('returns 404 when token not found', async () => {
    const err = new Error('Token not found');
    err.status = 404;
    subscriptionService.unsubscribe.mockRejectedValue(err);

    const res = await request(app).get('/api/unsubscribe/bad-token');

    expect(res.status).toBe(404);
  });

  test('returns 400 when token is invalid', async () => {
    const err = new Error('Invalid token');
    err.status = 400;
    subscriptionService.unsubscribe.mockRejectedValue(err);

    const res = await request(app).get('/api/unsubscribe/bad');

    expect(res.status).toBe(400);
  });
});
