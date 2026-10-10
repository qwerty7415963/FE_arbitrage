import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTraderPositions } from '@/hooks/use-trader-positions';
import { useTraderTrades } from '@/hooks/use-trader-trades';
import { useTraderActivity } from '@/hooks/use-trader-activity';
import { useTraderDetail } from '@/hooks/use-trader-detail';
import { useTraderPerformance } from '@/hooks/use-trader-performance';
import { useTraderBalances } from '@/hooks/use-trader-balances';
import { useTraderFills } from '@/hooks/use-trader-fills';
import { useTraderOrders } from '@/hooks/use-trader-orders';
import { useTraderTransfers } from '@/hooks/use-trader-transfers';
import { TRADER_DATA_REFETCH_INTERVAL_MS, traderDataRefetchInterval } from '@/lib/trader-poll';
import {
  fetchTraderActivity,
  fetchTraderBalances,
  fetchTraderDetail,
  fetchTraderFills,
  fetchTraderOrders,
  fetchTraderPerformance,
  fetchTraderPositions,
  fetchTraderTransfers,
} from '@/services/traders';

vi.mock('@/services/traders', () => ({
  fetchTraderDetail: vi.fn(),
  fetchTraderPositions: vi.fn(),
  fetchTraderActivity: vi.fn(),
  fetchTraderBalances: vi.fn(),
  fetchTraderFills: vi.fn(),
  fetchTraderOrders: vi.fn(),
  fetchTraderTransfers: vi.fn(),
  fetchTraderPerformance: vi.fn(),
}));

vi.mock('@/lib/trader-activity-ws', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/trader-activity-ws')>();
  return {
    ...actual,
    connectTradeActivityWS: vi.fn(() => ({ close: vi.fn() })),
  };
});

const WALLET = '0xABCDEF123456789012345678901234567890ABCD';

const positionsSnapshot = {
  summary: null,
  positions: [],
  data_status: 'ready' as const,
  as_of: null,
};

const activityPage = {
  rows: [],
  next_cursor: null,
  has_more: false,
  counts: { win: 0, loss: 0, long: 0, short: 0, total: 0 },
  data_status: 'ready' as const,
  as_of: '2026-10-08T00:00:00Z',
  partial: false,
};

const detailSnapshot = {
  registry: {
    wallet_address: WALLET.toLowerCase(),
    venue: 'hyperliquid',
    venue_id: null,
    display_name: 'Poll Wallet',
    discovery_source: 'leaderboard' as const,
    first_seen_at: '2024-01-01T00:00:00Z',
    last_seen_at: '2024-01-02T00:00:00Z',
    last_trade_at: '2024-01-02T00:00:00Z',
    leaderboard_seen_at: null,
    status: 'active' as const,
  },
  metrics: null,
  period: '30D' as const,
};

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('traderDataRefetchInterval', () => {
  it('polls every 30s while pending or success', () => {
    expect(TRADER_DATA_REFETCH_INTERVAL_MS).toBe(30_000);
    expect(traderDataRefetchInterval({ state: { status: 'pending' } } as never)).toBe(30_000);
    expect(traderDataRefetchInterval({ state: { status: 'success' } } as never)).toBe(30_000);
  });

  it('stops on query error (manual retry only)', () => {
    expect(traderDataRefetchInterval({ state: { status: 'error' } } as never)).toBe(false);
  });
});

describe('trader-data polling (30s, FE-only)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(fetchTraderPositions).mockResolvedValue(positionsSnapshot);
    vi.mocked(fetchTraderActivity).mockResolvedValue(activityPage);
    vi.mocked(fetchTraderDetail).mockResolvedValue(detailSnapshot);
    vi.mocked(fetchTraderPerformance).mockResolvedValue({
      period: '30D',
      metrics: null,
      equity: [],
    });
    vi.mocked(fetchTraderBalances).mockResolvedValue({
      perp: null,
      spot: null,
      data_status: 'ready',
    });
    vi.mocked(fetchTraderFills).mockResolvedValue({ rows: [], next_cursor: null, has_more: false });
    vi.mocked(fetchTraderOrders).mockResolvedValue({ status: 'open', rows: [] });
    vi.mocked(fetchTraderTransfers).mockResolvedValue({
      rows: [],
      next_cursor: null,
      has_more: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('useTraderPositions refetches after 30s', async () => {
    renderHook(() => useTraderPositions(WALLET), { wrapper: createWrapper() });
    await vi.waitFor(() => expect(fetchTraderPositions).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(30_000);
    await vi.waitFor(() => expect(fetchTraderPositions).toHaveBeenCalledTimes(2));
  });

  it('useTraderTrades refetches after 30s', async () => {
    renderHook(() => useTraderTrades(WALLET), { wrapper: createWrapper() });
    await vi.waitFor(() => expect(fetchTraderActivity).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(30_000);
    await vi.waitFor(() => expect(fetchTraderActivity).toHaveBeenCalledTimes(2));
  });

  it('useTraderActivity refetches after 30s', async () => {
    renderHook(() => useTraderActivity(WALLET), { wrapper: createWrapper() });
    await vi.waitFor(() => expect(fetchTraderActivity).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(30_000);
    await vi.waitFor(() => expect(fetchTraderActivity).toHaveBeenCalledTimes(2));
  });

  it('useTraderDetail (overview) refetches after 30s', async () => {
    renderHook(() => useTraderDetail(WALLET), { wrapper: createWrapper() });
    await vi.waitFor(() => expect(fetchTraderDetail).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(30_000);
    await vi.waitFor(() => expect(fetchTraderDetail).toHaveBeenCalledTimes(2));
  });

  it('useTraderPerformance refetches after 30s', async () => {
    renderHook(() => useTraderPerformance(WALLET), { wrapper: createWrapper() });
    await vi.waitFor(() => expect(fetchTraderPerformance).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(30_000);
    await vi.waitFor(() => expect(fetchTraderPerformance).toHaveBeenCalledTimes(2));
  });

  it('useTraderBalances refetches after 30s', async () => {
    renderHook(() => useTraderBalances(WALLET), { wrapper: createWrapper() });
    await vi.waitFor(() => expect(fetchTraderBalances).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(30_000);
    await vi.waitFor(() => expect(fetchTraderBalances).toHaveBeenCalledTimes(2));
  });

  it('useTraderFills refetches after 30s', async () => {
    renderHook(() => useTraderFills(WALLET), { wrapper: createWrapper() });
    await vi.waitFor(() => expect(fetchTraderFills).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(30_000);
    await vi.waitFor(() => expect(fetchTraderFills).toHaveBeenCalledTimes(2));
  });

  it('useTraderOrders refetches after 30s', async () => {
    renderHook(() => useTraderOrders(WALLET), { wrapper: createWrapper() });
    await vi.waitFor(() => expect(fetchTraderOrders).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(30_000);
    await vi.waitFor(() => expect(fetchTraderOrders).toHaveBeenCalledTimes(2));
  });

  it('useTraderTransfers refetches after 30s', async () => {
    renderHook(() => useTraderTransfers(WALLET), { wrapper: createWrapper() });
    await vi.waitFor(() => expect(fetchTraderTransfers).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(30_000);
    await vi.waitFor(() => expect(fetchTraderTransfers).toHaveBeenCalledTimes(2));
  });

  it('stops polling after an error (manual retry only)', async () => {
    vi.mocked(fetchTraderPositions).mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useTraderPositions(WALLET), {
      wrapper: createWrapper(),
    });
    await vi.waitFor(() => expect(result.current.error).toBeTruthy());
    expect(fetchTraderPositions).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchTraderPositions).toHaveBeenCalledTimes(1);
  });

  it('clears the timer on unmount', async () => {
    const { unmount } = renderHook(() => useTraderPositions(WALLET), {
      wrapper: createWrapper(),
    });
    await vi.waitFor(() => expect(fetchTraderPositions).toHaveBeenCalledTimes(1));
    unmount();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchTraderPositions).toHaveBeenCalledTimes(1);
  });

  it('inactive tabs (enabled:false) never start a timer', async () => {
    renderHook(() => useTraderPositions(WALLET, { enabled: false }), {
      wrapper: createWrapper(),
    });
    renderHook(() => useTraderTrades(WALLET, { enabled: false }), {
      wrapper: createWrapper(),
    });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchTraderPositions).not.toHaveBeenCalled();
    expect(fetchTraderActivity).not.toHaveBeenCalled();
  });
});
