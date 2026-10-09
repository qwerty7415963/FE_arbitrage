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

const livePage = {
  rows: [
    {
      market: 'BTC',
      side: 'LONG' as const,
      opened_at: '2026-10-01T00:00:00Z',
      closed_at: '2026-10-03T12:00:00Z',
      duration_sec: 216000,
      volume: 30500,
      entry_price: 60000,
      exit_price: 62000,
      pnl: 1500,
      fees: 30,
      funding: -12.5,
      net_pnl: 1470,
      fills: 3,
    },
  ],
  next_cursor: 'c1',
  has_more: true,
  counts: { win: 1, loss: 0, long: 1, short: 0, total: 1 },
  data_status: 'ready' as const,
  as_of: '2026-10-08T00:00:00Z',
  partial: false,
};

describe('useTraderActivity (contract v1.2 live)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('maps pages into trades with funding, as_of and partial', async () => {
    vi.mocked(fetchTraderActivity)
      .mockResolvedValueOnce(livePage)
      .mockResolvedValueOnce({
        rows: [],
        next_cursor: null,
        has_more: false,
        counts: { win: 1, loss: 0, long: 1, short: 0, total: 1 },
        data_status: 'ready' as const,
        as_of: '2026-10-08T00:00:00Z',
        partial: false,
      });

    const { result } = renderHook(
      () => useTraderActivity('0xABCDEF123456789012345678901234567890ABCD'),
      { wrapper },
    );

    await waitFor(() => expect(result.current.trades).toHaveLength(1));
    expect(result.current.trades[0].market).toBe('BTC');
    expect(result.current.trades[0].funding).toBe(-12.5);
    expect(result.current.dataStatus).toBe('ready');
    expect(result.current.asOf).toBe('2026-10-08T00:00:00Z');
    expect(result.current.partial).toBe(false);
    expect(vi.mocked(fetchTraderActivity).mock.calls[0][0]).toBe(
      '0xabcdef123456789012345678901234567890abcd',
    );
    expect(vi.mocked(fetchTraderActivity).mock.calls[0][1]).toEqual({ cursor: undefined });

    result.current.fetchNextPage();
    await waitFor(() =>
      expect(vi.mocked(fetchTraderActivity).mock.calls[1][1]).toEqual({ cursor: 'c1' }),
    );
  });

  it('starts with empty live fills/fundings and a disconnected transport', async () => {
    vi.mocked(fetchTraderActivity).mockResolvedValue({
      rows: [],
      next_cursor: null,
      has_more: false,
      counts: { win: 0, loss: 0, long: 0, short: 0, total: 0 },
      data_status: 'ready' as const,
      as_of: '2026-10-08T00:00:00Z',
      partial: false,
    });
    const { result } = renderHook(
      () => useTraderActivity('0xABCDEF123456789012345678901234567890ABCD'),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.liveFills).toEqual([]);
    expect(result.current.liveFundings).toEqual([]);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.live).toBe('disconnected');
    expect(result.current.connection).toBeNull();
    expect(typeof result.current.refetch).toBe('function');
    expect(vi.mocked(fetchTraderActivity).mock.calls[0][0]).toBe(
      '0xabcdef123456789012345678901234567890abcd',
    );
    expect(vi.mocked(connectTradeActivityWS).mock.calls[0][0]).toBe(
      '0xabcdef123456789012345678901234567890abcd',
    );
  });

  it('surfaces error data_status without syncing states', async () => {
    vi.mocked(fetchTraderActivity).mockResolvedValue({
      rows: [],
      next_cursor: null,
      has_more: false,
      counts: { win: 0, loss: 0, long: 0, short: 0, total: 0 },
      data_status: 'error' as const,
      as_of: null,
      partial: false,
    });
    const { result } = renderHook(
      () => useTraderActivity('0xABCDEF123456789012345678901234567890ABCD'),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.dataStatus).toBe('error');
  });
});
