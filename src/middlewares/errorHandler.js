/**
 * Central error handling middleware.
 * Logs the error and returns a consistent JSON response.
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${status}: ${err.message}`);

  if (status === 500) {
    console.error(err.stack);
  }

  res.status(status).json({ message });
}

module.exports = errorHandler;
