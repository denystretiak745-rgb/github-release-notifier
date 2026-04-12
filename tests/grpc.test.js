const handlers = require('../src/grpc/handlers');
const subscriptionService = require('../src/services/subscriptionService');

jest.mock('../src/services/subscriptionService');

function makeCall(request) {
  return { request };
}

describe('gRPC handlers', () => {
  afterEach(() => jest.resetAllMocks());

  describe('subscribe', () => {
    test('returns success message on valid subscription', async () => {
      subscriptionService.subscribe.mockResolvedValue({});
      const callback = jest.fn();

      await handlers.subscribe(makeCall({ email: 'a@b.com', repo: 'owner/repo' }), callback);

      expect(callback).toHaveBeenCalledWith(null, {
        message: 'Subscription successful. Confirmation email sent.',
      });
    });

    test('returns INVALID_ARGUMENT on 400 error', async () => {
      const err = new Error('Invalid input');
      err.status = 400;
      subscriptionService.subscribe.mockRejectedValue(err);
      const callback = jest.fn();

      await handlers.subscribe(makeCall({ email: '', repo: '' }), callback);

      expect(callback).toHaveBeenCalledWith({ code: 3, message: 'Invalid input' });
    });

    test('returns NOT_FOUND on 404 error', async () => {
      const err = new Error('Repository not found on GitHub');
      err.status = 404;
      subscriptionService.subscribe.mockRejectedValue(err);
      const callback = jest.fn();

      await handlers.subscribe(makeCall({ email: 'a@b.com', repo: 'x/y' }), callback);

      expect(callback).toHaveBeenCalledWith({ code: 5, message: 'Repository not found on GitHub' });
    });

    test('returns ALREADY_EXISTS on 409 error', async () => {
      const err = new Error('Already subscribed');
      err.status = 409;
      subscriptionService.subscribe.mockRejectedValue(err);
      const callback = jest.fn();

      await handlers.subscribe(makeCall({ email: 'a@b.com', repo: 'owner/repo' }), callback);

      expect(callback).toHaveBeenCalledWith({ code: 6, message: 'Already subscribed' });
    });

    test('returns INTERNAL on unknown error', async () => {
      subscriptionService.subscribe.mockRejectedValue(new Error('DB down'));
      const callback = jest.fn();

      await handlers.subscribe(makeCall({ email: 'a@b.com', repo: 'owner/repo' }), callback);

      expect(callback).toHaveBeenCalledWith({ code: 13, message: 'DB down' });
    });
  });

  describe('confirm', () => {
    test('returns success on valid token', async () => {
      subscriptionService.confirmSubscription.mockResolvedValue();
      const callback = jest.fn();

      await handlers.confirm(makeCall({ token: 'abc-123' }), callback);

      expect(callback).toHaveBeenCalledWith(null, { message: 'Subscription confirmed successfully' });
    });

    test('returns NOT_FOUND on 404', async () => {
      const err = new Error('Token not found');
      err.status = 404;
      subscriptionService.confirmSubscription.mockRejectedValue(err);
      const callback = jest.fn();

      await handlers.confirm(makeCall({ token: 'bad' }), callback);

      expect(callback).toHaveBeenCalledWith({ code: 5, message: 'Token not found' });
    });
  });

  describe('unsubscribe', () => {
    test('returns success on valid token', async () => {
      subscriptionService.unsubscribe.mockResolvedValue();
      const callback = jest.fn();

      await handlers.unsubscribe(makeCall({ token: 'abc-123' }), callback);

      expect(callback).toHaveBeenCalledWith(null, { message: 'Unsubscribed successfully' });
    });

    test('returns NOT_FOUND on 404', async () => {
      const err = new Error('Token not found');
      err.status = 404;
      subscriptionService.unsubscribe.mockRejectedValue(err);
      const callback = jest.fn();

      await handlers.unsubscribe(makeCall({ token: 'bad' }), callback);

      expect(callback).toHaveBeenCalledWith({ code: 5, message: 'Token not found' });
    });
  });

  describe('listSubscriptions', () => {
    test('returns subscriptions list', async () => {
      subscriptionService.getSubscriptions.mockResolvedValue([
        { email: 'a@b.com', repo: 'owner/repo', confirmed: true, last_seen_tag: 'v1.0' },
        { email: 'a@b.com', repo: 'org/lib', confirmed: true, last_seen_tag: null },
      ]);
      const callback = jest.fn();

      await handlers.listSubscriptions(makeCall({ email: 'a@b.com' }), callback);

      expect(callback).toHaveBeenCalledWith(null, {
        subscriptions: [
          { email: 'a@b.com', repo: 'owner/repo', confirmed: true, last_seen_tag: 'v1.0' },
          { email: 'a@b.com', repo: 'org/lib', confirmed: true, last_seen_tag: '' },
        ],
      });
    });

    test('returns empty list when no subscriptions', async () => {
      subscriptionService.getSubscriptions.mockResolvedValue([]);
      const callback = jest.fn();

      await handlers.listSubscriptions(makeCall({ email: 'a@b.com' }), callback);

      expect(callback).toHaveBeenCalledWith(null, { subscriptions: [] });
    });

    test('returns INVALID_ARGUMENT on bad email', async () => {
      const err = new Error('Invalid email');
      err.status = 400;
      subscriptionService.getSubscriptions.mockRejectedValue(err);
      const callback = jest.fn();

      await handlers.listSubscriptions(makeCall({ email: 'bad' }), callback);

      expect(callback).toHaveBeenCalledWith({ code: 3, message: 'Invalid email' });
    });
  });
});
