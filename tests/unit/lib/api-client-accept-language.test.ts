import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, apiClientNoAuth } from '@/infrastructure/api-client';
import * as tokenLib from '@/lib/token';

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

vi.mock('@/lib/auth-events', () => ({
  emitUnauthorized: vi.fn(),
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

describe('api-client Accept-Language', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(tokenLib.getAccessToken).mockReturnValue(null);
    vi.mocked(tokenLib.getRefreshToken).mockReturnValue(null);
    document.documentElement.lang = '';
    document.cookie = '';
    mockFetch.mockReset();
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  it('defaults to vi when no lang or cookie', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
    await apiClient('/test');
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.get('Accept-Language')).toBe('vi');
  });

  it('reads locale from document.documentElement.lang', async () => {
    document.documentElement.lang = 'en';
    mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
    await apiClient('/test');
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.get('Accept-Language')).toBe('en');
  });

  it('reads locale from NEXT_LOCALE cookie when lang is empty', async () => {
    document.cookie = 'NEXT_LOCALE=en; path=/';
    mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
    await apiClient('/test');
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.get('Accept-Language')).toBe('en');
  });

  it('adds Accept-Language to apiClientNoAuth', async () => {
    document.documentElement.lang = 'en';
    mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
    await apiClientNoAuth('/test');
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.get('Accept-Language')).toBe('en');
  });
});
