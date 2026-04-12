const request = require('supertest');
const env = require('../src/config/env');
const app = require('../src/app');

jest.mock('../src/services/subscriptionService');

describe('API key auth integration', () => {
  let originalApiKeys;

  beforeAll(() => {
    originalApiKeys = env.apiKeys;
    env.apiKeys = ['test-api-key'];
  });

  afterAll(() => {
    env.apiKeys = originalApiKeys;
  });

  test('POST /api/subscribe returns 401 without API key', async () => {
    const res = await request(app)
      .post('/api/subscribe')
      .send({ email: 'a@b.com', repo: 'owner/repo' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('API key required');
  });

  test('POST /api/subscribe returns 403 with invalid API key', async () => {
    const res = await request(app)
      .post('/api/subscribe')
      .set('X-API-Key', 'bad-key')
      .send({ email: 'a@b.com', repo: 'owner/repo' });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Invalid API key');
  });

  test('GET /api/subscriptions returns 401 without API key', async () => {
    const res = await request(app)
      .get('/api/subscriptions?email=a@b.com');

    expect(res.status).toBe(401);
  });

  test('GET /api/confirm/:token is exempt from API key auth', async () => {
    const subscriptionService = require('../src/services/subscriptionService');
    subscriptionService.confirmSubscription.mockResolvedValue();

    const res = await request(app)
      .get('/api/confirm/some-token');

    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  test('GET /api/unsubscribe/:token is exempt from API key auth', async () => {
    const subscriptionService = require('../src/services/subscriptionService');
    subscriptionService.unsubscribe.mockResolvedValue();

    const res = await request(app)
      .get('/api/unsubscribe/some-token');

    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});
