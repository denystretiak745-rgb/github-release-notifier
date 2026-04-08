const request = require('supertest');
const app = require('../src/app');

describe('App setup', () => {
  test('GET /api/subscriptions returns 501 (not yet implemented)', async () => {
    const res = await request(app).get('/api/subscriptions?email=test@example.com');
    expect(res.status).toBe(501);
  });
});
