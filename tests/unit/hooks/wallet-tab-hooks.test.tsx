import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTraderPositions } from '@/hooks/use-trader-positions';
import { useTraderBalances } from '@/hooks/use-trader-balances';
import { useTraderFills } from '@/hooks/use-trader-fills';
import { useTraderOrders } from '@/hooks/use-trader-orders';
import { useTraderTransfers } from '@/hooks/use-trader-transfers';
import { useTraderPerformance } from '@/hooks/use-trader-performance';
import {
  fetchTraderBalances,
  fetchTraderFills,
  fetchTraderOrders,
  fetchTraderPerformance,
  fetchTraderPositions,
  fetchTraderTransfers,
} from '@/services/traders';

vi.mock('@/services/traders', () => ({
  fetchTraderPositions: vi.fn(),
  fetchTraderBalances: vi.fn(),
  fetchTraderFills: vi.fn(),
  fetchTraderOrders: vi.fn(),
  fetchTraderTransfers: vi.fn(),
  fetchTraderPerformance: vi.fn(),
  fetchTraderActivity: vi.fn(),
}));

const WALLET = '0xABCDEF123456789012345678901234567890ABCD';
const WALLET_LOWER = WALLET.toLowerCase();

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('wallet tab hooks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('useTraderPositions forwards sort and dir with a lowercased wallet', async () => {
    vi.mocked(fetchTraderPositions).mockResolvedValue({
      summary: null,
      positions: [],
      data_status: 'ready',
      as_of: null,
    });
    const { result } = renderHook(
      () => useTraderPositions(WALLET, { sort: 'unrealized_pnl', dir: 'desc' }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(vi.mocked(fetchTraderPositions).mock.calls[0][0]).toBe(WALLET_LOWER);
    expect(vi.mocked(fetchTraderPositions).mock.calls[0][1]).toEqual({
      sort: 'unrealized_pnl',
      dir: 'desc',
    });
    expect(result.current.snapshot?.positions).toEqual([]);
  });

  it('useTraderPositions stays idle when the tab is not enabled', async () => {
    vi.mocked(fetchTraderPositions).mockResolvedValue({
      summary: null,
      positions: [],
      data_status: 'ready',
      as_of: null,
    });
    renderHook(() => useTraderPositions(WALLET, { enabled: false }), { wrapper });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(fetchTraderPositions).not.toHaveBeenCalled();
  });

  it('useTraderBalances fetches the perp and spot snapshot', async () => {
    vi.mocked(fetchTraderBalances).mockResolvedValue({
      perp: null,
      spot: null,
      data_status: 'syncing',
    });
    const { result } = renderHook(() => useTraderBalances(WALLET), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(vi.mocked(fetchTraderBalances).mock.calls[0][0]).toBe(WALLET_LOWER);
    expect(result.current.balances?.data_status).toBe('syncing');
  });

  it('useTraderFills pages through fills by cursor', async () => {
    vi.mocked(fetchTraderFills)
      .mockResolvedValueOnce({
        rows: [
          {
            coin: 'ETH',
            side: 'SELL',
            dir: 'Close Long',
            size: 8.97,
            price: 2309.1,
            closed_pnl: 19.19,
            fee: -0.62,
            fee_token: 'USDC',
            time: '2026-10-08T00:00:00Z',
            tid: 1101266132350103,
            oid: 391239781497,
            crossed: false,
            start_position: '8.97',
          },
        ],
        next_cursor: 't1',
        has_more: true,
      })
      .mockResolvedValueOnce({ rows: [], next_cursor: null, has_more: false });
    const { result } = renderHook(() => useTraderFills(WALLET), { wrapper });

    await waitFor(() => expect(result.current.fills).toHaveLength(1));
    expect(result.current.fills[0].coin).toBe('ETH');
    result.current.fetchNextPage();
    await waitFor(() =>
      expect(vi.mocked(fetchTraderFills).mock.calls[1][1]).toMatchObject({ cursor: 't1' }),
    );
  });

  it('useTraderOrders forwards the status filter', async () => {
    vi.mocked(fetchTraderOrders).mockResolvedValue({ status: 'historical', rows: [] });
    const { result } = renderHook(() => useTraderOrders(WALLET, { status: 'historical' }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(vi.mocked(fetchTraderOrders).mock.calls[0][1]).toMatchObject({
      status: 'historical',
    });
  });

  it('useTraderTransfers forwards days and pages by cursor', async () => {
    vi.mocked(fetchTraderTransfers).mockResolvedValue({
      rows: [],
      next_cursor: null,
      has_more: false,
    });
    const { result } = renderHook(() => useTraderTransfers(WALLET, { days: 7 }), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(vi.mocked(fetchTraderTransfers).mock.calls[0][1]).toMatchObject({ days: 7 });
    expect(result.current.transfers).toEqual([]);
  });

  it('useTraderPerformance forwards the period', async () => {
    vi.mocked(fetchTraderPerformance).mockResolvedValue({
      period: '7D',
      metrics: null,
      equity: [],
    });
    const { result } = renderHook(() => useTraderPerformance(WALLET, { period: '7D' }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(vi.mocked(fetchTraderPerformance).mock.calls[0][1]).toEqual({ period: '7D' });
    expect(result.current.performance?.period).toBe('7D');
  });
});
