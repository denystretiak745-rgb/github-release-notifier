const express = require('express');
const subscriptionRoutes = require('./routes/subscriptions');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', subscriptionRoutes);

app.use(errorHandler);

module.exports = app;
