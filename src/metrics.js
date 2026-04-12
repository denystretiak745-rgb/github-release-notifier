const client = require('prom-client');

client.collectDefaultMetrics();

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
});

const githubApiRequestsTotal = new client.Counter({
  name: 'github_api_requests_total',
  help: 'Total number of GitHub API requests',
  labelNames: ['endpoint', 'status'],
});

const releaseScanDuration = new client.Histogram({
  name: 'release_scan_duration_seconds',
  help: 'Duration of release scanner runs in seconds',
  buckets: [1, 5, 10, 30, 60, 120],
});

/**
 * Express middleware to record request duration and count.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function metricsMiddleware(req, res, next) {
  const end = httpRequestDuration.startTimer({ method: req.method, route: req.path });

  res.on('finish', () => {
    end();
    httpRequestsTotal.inc({ method: req.method, route: req.path, status: res.statusCode });
  });

  next();
}

module.exports = {
  register: client.register,
  metricsMiddleware,
  httpRequestsTotal,
  httpRequestDuration,
  githubApiRequestsTotal,
  releaseScanDuration,
};
