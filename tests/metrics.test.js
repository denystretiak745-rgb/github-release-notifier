const {
  register,
  metricsMiddleware,
  getRouteLabel,
  httpRequestsTotal,
  httpRequestDuration,
  githubApiRequestsTotal,
  releaseScanDuration,
} = require('../src/metrics');

afterEach(() => {
  register.resetMetrics();
});

describe('metricsMiddleware', () => {
  it('increments http_requests_total and records duration on response finish', async () => {
    const req = {
      method: 'GET',
      baseUrl: '/api',
      route: { path: '/subscriptions' },
    };
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

    const metrics = await register.getMetricsAsJSON();
    const counter = metrics.find((m) => m.name === 'http_requests_total');
    expect(counter).toBeDefined();
    const entry = counter.values.find(
      (v) => v.labels.method === 'GET' && v.labels.route === '/api/subscriptions' && v.labels.status === 200
    );
    expect(entry).toBeDefined();
    expect(entry.value).toBe(1);

    const histogram = metrics.find((m) => m.name === 'http_request_duration_seconds');
    expect(histogram).toBeDefined();
    expect(histogram.values.length).toBeGreaterThan(0);
  });
});

describe('getRouteLabel', () => {
  it('returns Express route template when available', () => {
    const req = { baseUrl: '/api', route: { path: '/confirm/:token' } };
    expect(getRouteLabel(req)).toBe('/api/confirm/:token');
  });

  it('returns "unknown" when no route is matched', () => {
    expect(getRouteLabel({})).toBe('unknown');
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
