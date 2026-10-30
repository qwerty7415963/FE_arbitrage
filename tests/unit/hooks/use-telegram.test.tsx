import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTelegramStatus, useTelegramLink, useTelegramUnlink } from '@/hooks/use-telegram';
import { getStatus, createLink, unlink } from '@/services/telegram';

vi.mock('@/services/telegram', () => ({
  getStatus: vi.fn(),
  createLink: vi.fn(),
  unlink: vi.fn(),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function retryingWrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 2, retryDelay: 0 } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('use-telegram', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('useTelegramStatus queries with 10s staleTime', async () => {
    vi.mocked(getStatus).mockResolvedValue({
      connected: false,
      tg_username: null,
      locale: 'vi',
      status: 'disconnected',
      groups_enabled: 0,
    });
    const { result } = renderHook(() => useTelegramStatus(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.connected).toBe(false);
  });

  it('useTelegramStatus does not run when disabled', async () => {
    const { result } = renderHook(() => useTelegramStatus({ enabled: false }), { wrapper });

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));

    expect(getStatus).not.toHaveBeenCalled();
  });

  it('useTelegramStatus disables retries', async () => {
    vi.mocked(getStatus).mockRejectedValue(new Error('status failed'));

    const { result } = renderHook(() => useTelegramStatus(), { wrapper: retryingWrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(getStatus).toHaveBeenCalledTimes(1);
  });

  it('useTelegramLink calls createLink', async () => {
    vi.mocked(createLink).mockResolvedValue({
      code: 'ABC',
      deep_link: 'https://t.me/bot?start=ABC',
      expires_at: '2026-01-01T00:00:00Z',
    });
    const { result } = renderHook(() => useTelegramLink(), { wrapper });
    const data = await result.current.mutateAsync('en');
    expect(createLink).toHaveBeenCalledWith('en');
    expect(data.code).toBe('ABC');
  });

  it('useTelegramUnlink calls unlink', async () => {
    vi.mocked(unlink).mockResolvedValue(undefined);
    const { result } = renderHook(() => useTelegramUnlink(), { wrapper });
    await result.current.mutateAsync();
    expect(unlink).toHaveBeenCalled();
  });
});
