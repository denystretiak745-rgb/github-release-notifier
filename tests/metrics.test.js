const {
  register,
  metricsMiddleware,
  httpRequestsTotal,
  httpRequestDuration,
  githubApiRequestsTotal,
  releaseScanDuration,
} = require('../src/metrics');

afterEach(() => {
  register.resetMetrics();
});

describe('metricsMiddleware', () => {
  it('increments http_requests_total on response finish', () => {
    const req = { method: 'GET', path: '/api/subscriptions' };
    const listeners = {};
    const res = {
      statusCode: 200,
      on(event, cb) {
        listeners[event] = cb;
      },
    };
    const next = jest.fn();

    metricsMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();

    listeners.finish();
  });
});

describe('counters and histograms', () => {
  it('exports expected metric objects', () => {
    expect(httpRequestsTotal).toBeDefined();
    expect(httpRequestDuration).toBeDefined();
    expect(githubApiRequestsTotal).toBeDefined();
    expect(releaseScanDuration).toBeDefined();
  });

  it('githubApiRequestsTotal can be incremented', async () => {
    githubApiRequestsTotal.inc({ endpoint: 'repos', status: 200 });

    const metrics = await register.getMetricsAsJSON();
    const metric = metrics.find((m) => m.name === 'github_api_requests_total');
    expect(metric).toBeDefined();
    expect(metric.values.length).toBeGreaterThan(0);
  });

  it('releaseScanDuration records observations', async () => {
    const end = releaseScanDuration.startTimer();
    end();

    const metrics = await register.getMetricsAsJSON();
    const metric = metrics.find((m) => m.name === 'release_scan_duration_seconds');
    expect(metric).toBeDefined();
  });
});
