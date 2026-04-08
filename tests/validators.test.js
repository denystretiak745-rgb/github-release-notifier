const { isValidRepo, isValidEmail } = require('../src/utils/validators');

describe('isValidRepo', () => {
  test('accepts valid owner/repo format', () => {
    expect(isValidRepo('golang/go')).toBe(true);
    expect(isValidRepo('facebook/react')).toBe(true);
    expect(isValidRepo('my-org/my_repo.js')).toBe(true);
  });

  test('rejects missing slash', () => {
    expect(isValidRepo('golang')).toBe(false);
  });

  test('rejects empty string', () => {
    expect(isValidRepo('')).toBe(false);
  });

  test('rejects multiple slashes', () => {
    expect(isValidRepo('a/b/c')).toBe(false);
  });

  test('rejects non-string input', () => {
    expect(isValidRepo(null)).toBe(false);
    expect(isValidRepo(undefined)).toBe(false);
    expect(isValidRepo(123)).toBe(false);
  });

  test('rejects repo with spaces', () => {
    expect(isValidRepo('owner/ repo')).toBe(false);
    expect(isValidRepo('own er/repo')).toBe(false);
  });
});

describe('isValidEmail', () => {
  test('accepts valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co')).toBe(true);
  });

  test('rejects invalid emails', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('@missing.local')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  test('rejects non-string input', () => {
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
  });
});
