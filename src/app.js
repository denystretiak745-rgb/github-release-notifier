const path = require('path');
const express = require('express');
const requestLogger = require('./middlewares/requestLogger');
const apiKeyAuth = require('./middlewares/apiKeyAuth');
const subscriptionRoutes = require('./routes/subscriptions');
const errorHandler = require('./middlewares/errorHandler');
const { register, metricsMiddleware } = require('./metrics');

const app = express();

app.use(metricsMiddleware);
app.use(requestLogger);
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

app.use('/api', apiKeyAuth, subscriptionRoutes);

app.use(errorHandler);

module.exports = app;
