let githubService;
let redisModule;

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
};

beforeEach(() => {
  jest.resetModules();
  jest.restoreAllMocks();
  mockRedis.get.mockReset();
  mockRedis.set.mockReset();

  redisModule = require('../src/config/redis');
  redisModule.setClient(mockRedis);
  githubService = require('../src/services/githubService');

  global.fetch = jest.fn();
});

afterAll(() => {
  redisModule.setClient(null);
});

describe('checkRepoExists caching', () => {
  test('returns cached value on cache hit (true)', async () => {
    mockRedis.get.mockResolvedValue('true');

    const result = await githubService.checkRepoExists('owner/repo');

    expect(result).toBe(true);
    expect(mockRedis.get).toHaveBeenCalledWith('repo:exists:owner/repo');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('returns cached value on cache hit (false)', async () => {
    mockRedis.get.mockResolvedValue('false');

    const result = await githubService.checkRepoExists('owner/repo');

    expect(result).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('fetches from GitHub and caches on miss', async () => {
    mockRedis.get.mockResolvedValue(null);
    global.fetch.mockResolvedValue({ status: 200 });

    const result = await githubService.checkRepoExists('owner/repo');

    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalled();
    expect(mockRedis.set).toHaveBeenCalledWith('repo:exists:owner/repo', 'true', 'EX', 600);
  });

  test('caches 404 as false', async () => {
    mockRedis.get.mockResolvedValue(null);
    global.fetch.mockResolvedValue({ status: 404 });

    const result = await githubService.checkRepoExists('owner/missing');

    expect(result).toBe(false);
    expect(mockRedis.set).toHaveBeenCalledWith('repo:exists:owner/missing', 'false', 'EX', 600);
  });

  test('does not cache on error', async () => {
    mockRedis.get.mockResolvedValue(null);
    global.fetch.mockResolvedValue({
      status: 429,
      headers: { get: () => '30' },
    });

    await expect(githubService.checkRepoExists('owner/repo')).rejects.toThrow('rate limit');
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  test('gracefully handles Redis get failure', async () => {
    mockRedis.get.mockRejectedValue(new Error('connection lost'));
    global.fetch.mockResolvedValue({ status: 200 });

    const result = await githubService.checkRepoExists('owner/repo');

    expect(result).toBe(true);
  });
});

describe('getLatestRelease caching', () => {
  const releaseData = { tag_name: 'v1.0.0', html_url: 'https://github.com/owner/repo/releases/tag/v1.0.0' };

  test('returns cached release on cache hit', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify(releaseData));

    const result = await githubService.getLatestRelease('owner/repo');

    expect(result).toEqual(releaseData);
    expect(mockRedis.get).toHaveBeenCalledWith('repo:release:owner/repo');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('fetches from GitHub and caches on miss', async () => {
    mockRedis.get.mockResolvedValue(null);
    global.fetch.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve(releaseData),
    });

    const result = await githubService.getLatestRelease('owner/repo');

    expect(result).toEqual(releaseData);
    expect(mockRedis.set).toHaveBeenCalledWith(
      'repo:release:owner/repo',
      JSON.stringify(releaseData),
      'EX',
      600
    );
  });

  test('fetches fresh on corrupted cache entry', async () => {
    mockRedis.get.mockResolvedValue('not-valid-json{{{');
    global.fetch.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve(releaseData),
    });

    const result = await githubService.getLatestRelease('owner/repo');

    expect(result).toEqual(releaseData);
    expect(global.fetch).toHaveBeenCalled();
  });

  test('returns null for 404 without caching', async () => {
    mockRedis.get.mockResolvedValue(null);
    global.fetch.mockResolvedValue({ status: 404 });

    const result = await githubService.getLatestRelease('owner/missing');

    expect(result).toBeNull();
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  test('gracefully handles Redis set failure', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockRejectedValue(new Error('write failed'));
    global.fetch.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve(releaseData),
    });

    const result = await githubService.getLatestRelease('owner/repo');

    expect(result).toEqual(releaseData);
  });
});
