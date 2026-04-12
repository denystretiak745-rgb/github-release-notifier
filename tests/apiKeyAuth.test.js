const env = require('../src/config/env');
const apiKeyAuth = require('../src/middlewares/apiKeyAuth');

describe('apiKeyAuth middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    env.apiKeys = [];
  });

  test('passes through when API_KEYS is not configured', () => {
    env.apiKeys = [];

    apiKeyAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 401 when API key is missing', () => {
    env.apiKeys = ['valid-key'];

    apiKeyAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'API key required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when API key is invalid', () => {
    env.apiKeys = ['valid-key'];
    req.headers['x-api-key'] = 'wrong-key';

    apiKeyAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid API key' });
    expect(next).not.toHaveBeenCalled();
  });

  test('passes through with valid API key', () => {
    env.apiKeys = ['valid-key'];
    req.headers['x-api-key'] = 'valid-key';

    apiKeyAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('accepts any of multiple valid keys', () => {
    env.apiKeys = ['key-one', 'key-two', 'key-three'];
    req.headers['x-api-key'] = 'key-two';

    apiKeyAuth(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
