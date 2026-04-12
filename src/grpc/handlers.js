const subscriptionService = require('../services/subscriptionService');

/**
 * Maps service errors to gRPC status codes.
 * @param {Error} err
 * @returns {{code: number, message: string}}
 */
function mapError(err) {
  const grpcCodes = {
    400: 3,  // INVALID_ARGUMENT
    404: 5,  // NOT_FOUND
    409: 6,  // ALREADY_EXISTS
    429: 8,  // RESOURCE_EXHAUSTED
  };
  return {
    code: grpcCodes[err.status] || 13, // 13 = INTERNAL
    message: err.message,
  };
}

async function subscribe(call, callback) {
  try {
    const { email, repo } = call.request;
    await subscriptionService.subscribe(email, repo);
    callback(null, { message: 'Subscription successful. Confirmation email sent.' });
  } catch (err) {
    callback(mapError(err));
  }
}

async function confirm(call, callback) {
  try {
    await subscriptionService.confirmSubscription(call.request.token);
    callback(null, { message: 'Subscription confirmed successfully' });
  } catch (err) {
    callback(mapError(err));
  }
}

async function unsubscribe(call, callback) {
  try {
    await subscriptionService.unsubscribe(call.request.token);
    callback(null, { message: 'Unsubscribed successfully' });
  } catch (err) {
    callback(mapError(err));
  }
}

async function listSubscriptions(call, callback) {
  try {
    const subs = await subscriptionService.getSubscriptions(call.request.email);
    callback(null, {
      subscriptions: subs.map((s) => ({
        email: s.email,
        repo: s.repo,
        confirmed: s.confirmed,
        last_seen_tag: s.last_seen_tag || '',
      })),
    });
  } catch (err) {
    callback(mapError(err));
  }
}

module.exports = { subscribe, confirm, unsubscribe, listSubscriptions };
