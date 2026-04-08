const request = require('supertest');
const app = require('../src/app');
const subscriptionService = require('../src/services/subscriptionService');

jest.mock('../src/services/subscriptionService');

describe('POST /api/subscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 200 on successful subscription (JSON body)', async () => {
    subscriptionService.subscribe.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      repo: 'owner/repo',
      confirmed: false,
    });

    const res = await request(app)
      .post('/api/subscribe')
      .send({ email: 'test@example.com', repo: 'owner/repo' });

    expect(res.status).toBe(200);
    expect(subscriptionService.subscribe).toHaveBeenCalledWith('test@example.com', 'owner/repo');
  });

  test('returns 200 on successful subscription (form-urlencoded)', async () => {
    subscriptionService.subscribe.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      repo: 'owner/repo',
      confirmed: false,
    });

    const res = await request(app)
      .post('/api/subscribe')
      .type('form')
      .send('email=test@example.com&repo=owner/repo');

    expect(res.status).toBe(200);
  });

  test('returns 400 for invalid input', async () => {
    const err = new Error('Invalid input');
    err.status = 400;
    subscriptionService.subscribe.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/subscribe')
      .send({ email: 'bad', repo: 'bad' });

    expect(res.status).toBe(400);
  });

  test('returns 404 when repo not found', async () => {
    const err = new Error('Repository not found on GitHub');
    err.status = 404;
    subscriptionService.subscribe.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/subscribe')
      .send({ email: 'test@example.com', repo: 'owner/missing' });

    expect(res.status).toBe(404);
  });

  test('returns 409 when already subscribed', async () => {
    const err = new Error('Email already subscribed to this repository');
    err.status = 409;
    subscriptionService.subscribe.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/subscribe')
      .send({ email: 'test@example.com', repo: 'owner/repo' });

    expect(res.status).toBe(409);
  });
});
