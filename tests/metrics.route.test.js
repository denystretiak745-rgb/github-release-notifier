const request = require('supertest');
const app = require('../src/app');

describe('GET /metrics', () => {
  it('returns Prometheus metrics in text format', async () => {
    const res = await request(app).get('/metrics');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('http_request_duration_seconds');
    expect(res.text).toContain('github_api_requests_total');
    expect(res.text).toContain('release_scan_duration_seconds');
  });

  it('does not require API key authentication', async () => {
    const env = require('../src/config/env');
    const originalKeys = env.apiKeys;
    env.apiKeys = ['test-secret-key'];

    try {
      const res = await request(app).get('/metrics');
      expect(res.status).toBe(200);
    } finally {
      env.apiKeys = originalKeys;
    }
  });
});
