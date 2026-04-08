const { Router } = require('express');
const subscriptionService = require('../services/subscriptionService');

const router = Router();

router.post('/subscribe', async (req, res, next) => {
  try {
    const { email, repo } = req.body;
    await subscriptionService.subscribe(email, repo);
    res.status(200).json({ message: 'Subscription successful. Confirmation email sent.' });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
});

router.get('/confirm/:token', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

router.get('/unsubscribe/:token', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

router.get('/subscriptions', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

module.exports = router;
