const request = require('supertest');
const app = require('../src/app');

describe('App setup', () => {
  test('responds to unknown routes with 404', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
  });
});
