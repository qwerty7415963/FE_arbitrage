import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTraderActivity } from '@/hooks/use-trader-activity';
import { fetchTraderActivity } from '@/services/traders';
import { connectTradeActivityWS } from '@/lib/trader-activity-ws';

vi.mock('@/services/traders', () => ({
  fetchTraderActivity: vi.fn(),
}));

vi.mock('@/lib/trader-activity-ws', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/trader-activity-ws')>();
  return {
    ...actual,
    connectTradeActivityWS: vi.fn(() => ({ close: vi.fn() })),
  };
});

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useTraderActivity', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('maps pages into trades and exposes hasMore from next_cursor', async () => {
    vi.mocked(fetchTraderActivity)
      .mockResolvedValueOnce({
        rows: [
          {
            market: 'BTC',
            side: 'LONG',
            opened_at: '2026-10-06T08:00:00Z',
            closed_at: '2026-10-06T08:30:00Z',
            volume: 30000,
            pnl: 1500,
            fees: 30,
            net_pnl: 1470,
            fills: 3,
          },
        ],
        next_cursor: 'c1',
        has_more: true,
      })
      .mockResolvedValueOnce({ rows: [], next_cursor: null, has_more: false });

    const { result } = renderHook(
      () => useTraderActivity('0xABCDEF123456789012345678901234567890ABCD'),
      { wrapper },
    );

    await waitFor(() => expect(result.current.trades).toHaveLength(1));
    expect(result.current.trades[0].market).toBe('BTC');
    expect(vi.mocked(fetchTraderActivity).mock.calls[0][0]).toBe(
      '0xabcdef123456789012345678901234567890abcd',
    );
    expect(vi.mocked(fetchTraderActivity).mock.calls[0][1]).toEqual({ cursor: undefined });

    result.current.fetchNextPage();
    await waitFor(() =>
      expect(vi.mocked(fetchTraderActivity).mock.calls[1][1]).toEqual({ cursor: 'c1' }),
    );
  });

  it('starts with empty live fills and a disconnected status', async () => {
    vi.mocked(fetchTraderActivity).mockResolvedValue({
      rows: [],
      next_cursor: null,
      has_more: false,
    });
    const { result } = renderHook(
      () => useTraderActivity('0xABCDEF123456789012345678901234567890ABCD'),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.liveFills).toEqual([]);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.live).toBe('disconnected');
    expect(typeof result.current.refetch).toBe('function');
    expect(vi.mocked(fetchTraderActivity).mock.calls[0][0]).toBe(
      '0xabcdef123456789012345678901234567890abcd',
    );
    expect(vi.mocked(connectTradeActivityWS).mock.calls[0][0]).toBe(
      '0xabcdef123456789012345678901234567890abcd',
    );
  });
});
