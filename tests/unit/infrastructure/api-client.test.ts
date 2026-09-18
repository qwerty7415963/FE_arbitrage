import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, apiClientNoAuth, ApiError } from '@/infrastructure/api-client';
import * as tokenLib from '@/lib/token';
import * as authService from '@/services/auth';

vi.mock('@/lib/token', () => ({
  getAccessToken: vi.fn(),
  getRefreshToken: vi.fn(),
  setAccessToken: vi.fn(),
  setRefreshToken: vi.fn(),
  clearTokens: vi.fn(),
}));

vi.mock('@/services/auth', () => ({
  refresh: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    headers: new Headers(),
  });
}

function errorResponse(status: number, body: unknown = {}) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve(body),
    headers: new Headers(),
  });
}

describe('apiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(tokenLib.getAccessToken).mockReturnValue(null);
    vi.mocked(tokenLib.getRefreshToken).mockReturnValue(null);
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  it('adds Content-Type header', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ success: true, data: 'test' }));

    await apiClient('/test');

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.get('Content-Type')).toBe('application/json');
  });

  it('adds X-Request-ID header', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ success: true }));

    await apiClient('/test');

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.get('X-Request-ID')).toBeTruthy();
  });

  it('adds Authorization header when token exists', async () => {
    vi.mocked(tokenLib.getAccessToken).mockReturnValue('my-token');
    mockFetch.mockResolvedValue(jsonResponse({ success: true }));

    await apiClient('/test');

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.get('Authorization')).toBe('Bearer my-token');
  });

  it('does not add Authorization when no token', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ success: true }));

    await apiClient('/test');

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.get('Authorization')).toBeNull();
  });

  it('returns parsed JSON on success', async () => {
    const data = { success: true, data: { id: 1 } };
    mockFetch.mockResolvedValue(jsonResponse(data));

    const result = await apiClient('/test');
    expect(result).toEqual(data);
  });

  it('returns empty object on 204 No Content', async () => {
    mockFetch.mockResolvedValue(jsonResponse({}, 204));

    const result = await apiClient('/test');
    expect(result).toEqual({});
  });

  it('throws ApiError on non-OK response', async () => {
    mockFetch.mockResolvedValue(
      errorResponse(400, { error: { code: 'BAD_REQUEST', message: 'Invalid input' } }),
    );

    await expect(apiClient('/test')).rejects.toThrow(ApiError);
  });

  it('throws ApiError with correct status and code', async () => {
    mockFetch.mockResolvedValue(
      errorResponse(404, { error: { code: 'NOT_FOUND', message: 'Not found' } }),
    );

    try {
      await apiClient('/test');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(404);
      expect((e as ApiError).code).toBe('NOT_FOUND');
    }
  });

  it('retries after token refresh on 401', async () => {
    vi.mocked(tokenLib.getRefreshToken).mockReturnValue('refresh-token');
    vi.mocked(authService.refresh).mockResolvedValue({
      access_token: 'new-access',
      refresh_token: 'new-refresh',
      expires_at: 123,
      user: { id: '1', email: 'a@b.com', role: 'user', status: 'active', created_at: '' },
    });

    mockFetch
      .mockResolvedValueOnce(errorResponse(401))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: 'ok' }));

    const result = await apiClient('/test');

    expect(authService.refresh).toHaveBeenCalledWith('refresh-token');
    expect(tokenLib.setAccessToken).toHaveBeenCalledWith('new-access');
    expect(tokenLib.setRefreshToken).toHaveBeenCalledWith('new-refresh');
    expect(result).toEqual({ success: true, data: 'ok' });
  });

  it('clears tokens and throws when refresh fails on 401', async () => {
    vi.mocked(tokenLib.getRefreshToken).mockReturnValue('refresh-token');
    vi.mocked(authService.refresh).mockRejectedValue(new Error('Refresh failed'));

    mockFetch.mockResolvedValue(errorResponse(401));

    await expect(apiClient('/test')).rejects.toThrow(ApiError);
    expect(tokenLib.clearTokens).toHaveBeenCalled();
  });
});

describe('apiClientNoAuth', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  it('does not add Authorization header', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ success: true }));

    await apiClientNoAuth('/test');

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.get('Authorization')).toBeNull();
  });

  it('adds Content-Type header', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ success: true }));

    await apiClientNoAuth('/test');

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.get('Content-Type')).toBe('application/json');
  });

  it('returns parsed JSON on success', async () => {
    const data = { success: true, data: 'test' };
    mockFetch.mockResolvedValue(jsonResponse(data));

    const result = await apiClientNoAuth('/test');
    expect(result).toEqual(data);
  });

  it('throws ApiError on error response', async () => {
    mockFetch.mockResolvedValue(
      errorResponse(401, { error: { code: 'UNAUTHORIZED', message: 'Invalid' } }),
    );

    await expect(apiClientNoAuth('/test')).rejects.toThrow(ApiError);
  });
});
