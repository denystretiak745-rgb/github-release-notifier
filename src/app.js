const path = require('path');
const express = require('express');
const requestLogger = require('./middlewares/requestLogger');
const subscriptionRoutes = require('./routes/subscriptions');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(requestLogger);
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', subscriptionRoutes);

app.use(errorHandler);

module.exports = app;
