import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTraderTrades } from '@/hooks/use-trader-trades';
import { fetchTraderActivity } from '@/services/traders';
import type { ActivityPage } from '@/types/trader';

vi.mock('@/services/traders', () => ({
  fetchTraderActivity: vi.fn(),
}));

const WALLET = '0xABCDEF123456789012345678901234567890ABCD';
const WALLET_LOWER = WALLET.toLowerCase();

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const page1: ActivityPage = {
  rows: [
    {
      market: 'BTC',
      side: 'LONG',
      opened_at: '2026-10-01T00:00:00Z',
      closed_at: '2026-10-03T12:00:00Z',
      duration_sec: 216000,
      volume: 30500,
      entry_price: 60000,
      exit_price: 62000,
      pnl: 1500,
      fees: 30,
      net_pnl: 1470,
      fills: 3,
    },
  ],
  next_cursor: 'c1',
  has_more: true,
  counts: { win: 133, loss: 67, long: 112, short: 88, total: 200 },
};

describe('useTraderTrades', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('maps contract rows and exposes counts from the response', async () => {
    vi.mocked(fetchTraderActivity).mockResolvedValueOnce(page1);
    const { result } = renderHook(() => useTraderTrades(WALLET), { wrapper });

    await waitFor(() => expect(result.current.trades).toHaveLength(1));
    expect(result.current.trades[0].market).toBe('BTC');
    expect(result.current.trades[0].duration_sec).toBe(216000);
    expect(result.current.counts).toEqual({ win: 133, loss: 67, long: 112, short: 88, total: 200 });
    expect(result.current.hasMore).toBe(true);
  });

  it('forwards server-side sort, dir, result and side filters', async () => {
    vi.mocked(fetchTraderActivity).mockResolvedValue({
      rows: [],
      next_cursor: null,
      has_more: false,
      counts: { win: 0, loss: 0, long: 0, short: 0, total: 0 },
    });
    const { result } = renderHook(
      () => useTraderTrades(WALLET, { sort: 'net_pnl', dir: 'asc', result: 'win', side: 'long' }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(vi.mocked(fetchTraderActivity).mock.calls[0][0]).toBe(WALLET_LOWER);
    expect(vi.mocked(fetchTraderActivity).mock.calls[0][1]).toEqual({
      sort: 'net_pnl',
      dir: 'asc',
      result: 'win',
      side: 'long',
      limit: 20,
      cursor: undefined,
    });
  });

  it('paginates with the opaque cursor', async () => {
    vi.mocked(fetchTraderActivity)
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce({
        rows: [],
        next_cursor: null,
        has_more: false,
        counts: { win: 133, loss: 67, long: 112, short: 88, total: 200 },
      });
    const { result } = renderHook(() => useTraderTrades(WALLET), { wrapper });

    await waitFor(() => expect(result.current.trades).toHaveLength(1));
    result.current.fetchNextPage();
    await waitFor(() =>
      expect(vi.mocked(fetchTraderActivity).mock.calls[1][1]).toMatchObject({ cursor: 'c1' }),
    );
  });

  it('stays idle when the tab is not enabled', async () => {
    vi.mocked(fetchTraderActivity).mockResolvedValue({
      rows: [],
      next_cursor: null,
      has_more: false,
      counts: { win: 0, loss: 0, long: 0, short: 0, total: 0 },
    });
    const { result } = renderHook(() => useTraderTrades(WALLET, { enabled: false }), { wrapper });

    expect(result.current.trades).toEqual([]);
    expect(result.current.counts).toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(fetchTraderActivity).not.toHaveBeenCalled();
  });
});
