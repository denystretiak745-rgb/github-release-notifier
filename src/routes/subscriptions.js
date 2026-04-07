const { Router } = require('express');

const router = Router();

router.post('/subscribe', (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
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
