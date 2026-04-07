function errorHandler(err, req, res, _next) {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
}

module.exports = errorHandler;
