const { isValidRepo, isValidEmail, parseRepo } = require('../src/utils/validators');

describe('parseRepo', () => {
  test('parses plain owner/repo format', () => {
    expect(parseRepo('golang/go')).toBe('golang/go');
    expect(parseRepo('facebook/react')).toBe('facebook/react');
    expect(parseRepo('my-org/my_repo.js')).toBe('my-org/my_repo.js');
  });

  test('extracts owner/repo from GitHub URL', () => {
    expect(parseRepo('https://github.com/lodash/lodash')).toBe('lodash/lodash');
    expect(parseRepo('https://github.com/facebook/react')).toBe('facebook/react');
    expect(parseRepo('https://github.com/facebook/react/')).toBe('facebook/react');
    expect(parseRepo('http://github.com/owner/repo')).toBe('owner/repo');
  });

  test('trims whitespace', () => {
    expect(parseRepo('  owner/repo  ')).toBe('owner/repo');
    expect(parseRepo('  https://github.com/owner/repo  ')).toBe('owner/repo');
  });

  test('returns null for invalid input', () => {
    expect(parseRepo('golang')).toBeNull();
    expect(parseRepo('')).toBeNull();
    expect(parseRepo('a/b/c')).toBeNull();
    expect(parseRepo(null)).toBeNull();
    expect(parseRepo(undefined)).toBeNull();
    expect(parseRepo(123)).toBeNull();
    expect(parseRepo('owner/ repo')).toBeNull();
    expect(parseRepo('https://gitlab.com/owner/repo')).toBeNull();
    expect(parseRepo('https://github.com/owner/repo/extra')).toBeNull();
  });
});

describe('isValidRepo', () => {
  test('accepts valid owner/repo format', () => {
    expect(isValidRepo('golang/go')).toBe(true);
    expect(isValidRepo('facebook/react')).toBe(true);
    expect(isValidRepo('my-org/my_repo.js')).toBe(true);
  });

  test('accepts GitHub URLs', () => {
    expect(isValidRepo('https://github.com/lodash/lodash')).toBe(true);
    expect(isValidRepo('https://github.com/facebook/react/')).toBe(true);
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
