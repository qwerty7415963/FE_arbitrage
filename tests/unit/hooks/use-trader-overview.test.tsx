import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTraderOverview, useTraderOverviewSeries } from '@/hooks/use-trader-overview';
import { fetchTraderOverview, fetchTraderOverviewSeries } from '@/services/traders';
import type { TraderOverview, TraderOverviewSeries } from '@/types/trader';

vi.mock('@/services/traders', () => ({
  fetchTraderOverview: vi.fn(),
  fetchTraderOverviewSeries: vi.fn(),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const overview: TraderOverview = {
  as_of: '2026-01-01T00:00:00Z',
  venue: 'hyperliquid',
  period: '30D',
  pnl_metric: 'realized_pnl',
  universe_size: 1,
  pnl_buckets: [],
  account_buckets: [],
  coverage: {
    pnl_wallets: 1,
    account_value_wallets: 1,
    series_wallets: 1,
    data_status: { ready: 1, stale: 0, error: 0, syncing: 0 },
  },
};

const series: TraderOverviewSeries = {
  venue: 'hyperliquid',
  period: '30D',
  pnl_metric: 'realized_pnl',
  series_days: 30,
  pnl_series: [],
  account_series: [],
  series_wallets: 1,
};

describe('useTraderOverview', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('fetches with correct query key and returns data', async () => {
    vi.mocked(fetchTraderOverview).mockResolvedValue(overview);
    const { result } = renderHook(() => useTraderOverview('hyperliquid', '30D', 30), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(overview);
    expect(fetchTraderOverview).toHaveBeenCalledWith({
      venue: 'hyperliquid',
      period: '30D',
      seriesDays: 30,
    });
  });

  it('supports params object', async () => {
    vi.mocked(fetchTraderOverview).mockResolvedValue(overview);
    const { result } = renderHook(
      () => useTraderOverview({ venue: 'hyperliquid', period: '7D', seriesDays: 14 }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchTraderOverview).toHaveBeenCalledWith({
      venue: 'hyperliquid',
      period: '7D',
      seriesDays: 14,
    });
  });

  it('exposes isFetching and refetch', async () => {
    vi.mocked(fetchTraderOverview).mockResolvedValue(overview);
    const { result } = renderHook(
      () => useTraderOverview({ venue: 'hyperliquid', period: '30D', seriesDays: 30 }),
      {
        wrapper,
      },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(typeof result.current.refetch).toBe('function');
    expect(typeof result.current.isFetching).toBe('boolean');
  });
});

describe('useTraderOverviewSeries', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('fetches with correct query key and returns data', async () => {
    vi.mocked(fetchTraderOverviewSeries).mockResolvedValue(series);
    const { result } = renderHook(
      () => useTraderOverviewSeries({ venue: 'hyperliquid', period: '30D', seriesDays: 30 }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(series);
    expect(fetchTraderOverviewSeries).toHaveBeenCalledWith({
      venue: 'hyperliquid',
      period: '30D',
      seriesDays: 30,
    });
  });

  it('respects enabled=false', async () => {
    vi.mocked(fetchTraderOverviewSeries).mockResolvedValue(series);
    const { result } = renderHook(
      () =>
        useTraderOverviewSeries({
          venue: 'hyperliquid',
          period: '30D',
          seriesDays: 30,
          enabled: false,
        }),
      { wrapper },
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(fetchTraderOverviewSeries).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });
});
