const request = require('supertest');
const app = require('../src/app');

describe('App setup', () => {
  test('POST /api/subscribe returns 501 (not yet implemented)', async () => {
    const res = await request(app)
      .post('/api/subscribe')
      .send({ email: 'test@example.com', repo: 'owner/repo' });
    expect(res.status).toBe(501);
  });

  test('GET /api/confirm/:token returns 501', async () => {
    const res = await request(app).get('/api/confirm/some-token');
    expect(res.status).toBe(501);
  });

  test('GET /api/unsubscribe/:token returns 501', async () => {
    const res = await request(app).get('/api/unsubscribe/some-token');
    expect(res.status).toBe(501);
  });

  test('GET /api/subscriptions returns 501', async () => {
    const res = await request(app).get('/api/subscriptions?email=test@example.com');
    expect(res.status).toBe(501);
  });
});
