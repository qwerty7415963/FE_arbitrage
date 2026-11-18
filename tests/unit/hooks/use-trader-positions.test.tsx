import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTraderPositions } from '@/hooks/use-trader-positions';
import { fetchTraderPositions } from '@/services/traders';
import { connectTradeActivityWS } from '@/lib/trader-activity-ws';
import type { OpenPosition, PositionSnapshot } from '@/types/trader';

vi.mock('@/services/traders', () => ({
  fetchTraderPositions: vi.fn(),
}));

vi.mock('@/lib/trader-activity-ws', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/trader-activity-ws')>();
  return {
    ...actual,
    connectTradeActivityWS: vi.fn(() => ({ close: vi.fn() })),
  };
});

const WALLET = '0xABCDEF123456789012345678901234567890ABCD';
const WALLET_LOWER = WALLET.toLowerCase();

function pos(coin: string, size = 1, entry: number | null = null): OpenPosition {
  return {
    coin,
    side: 'LONG',
    size,
    entry_price: entry,
    mark_price: null,
    position_value: null,
    unrealized_pnl: null,
    return_on_equity: null,
    liquidation_price: null,
    leverage: null,
    max_leverage: null,
    margin_used: null,
    as_of: null,
  };
}

const initialSnapshot: PositionSnapshot = {
  summary: null,
  positions: [pos('BTC', 1, 100)],
  data_status: 'ready',
  as_of: '2026-01-01T00:00:00Z',
};

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe('useTraderPositions (contract v2.3 Plan B)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(fetchTraderPositions).mockResolvedValue(initialSnapshot);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('patches cache with client-sorted positions on wallet.position.updated', async () => {
    const { queryClient, wrapper } = makeWrapper();
    const { result } = renderHook(() => useTraderPositions(WALLET), { wrapper });

    await waitFor(() => expect(result.current.snapshot).not.toBeNull());
    const callsBefore = vi.mocked(fetchTraderPositions).mock.calls.length;

    const handlers = vi.mocked(connectTradeActivityWS).mock.calls[0][3] as {
      onPosition?: (snapshot: PositionSnapshot) => void;
    };
    const incoming: PositionSnapshot = {
      summary: null,
      positions: [pos('Z', 1, 50), pos('A', 1, 10)],
      data_status: 'ready',
      as_of: '2026-01-02T00:00:00Z',
    };

    act(() => {
      handlers.onPosition?.(incoming);
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<PositionSnapshot>([
        'trader-positions',
        WALLET_LOWER,
        'coin',
        'asc',
      ]);
      expect(cached?.positions.map((p) => p.coin)).toEqual(['A', 'Z']);
    });

    expect(vi.mocked(fetchTraderPositions).mock.calls.length).toBe(callsBefore);
  });

  it('falls back to 30s polling when no WS push arrives', async () => {
    vi.useFakeTimers();
    const { wrapper } = makeWrapper();
    renderHook(() => useTraderPositions(WALLET), { wrapper });
    await vi.waitFor(() => expect(fetchTraderPositions).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(30_000);
    await vi.waitFor(() => expect(fetchTraderPositions).toHaveBeenCalledTimes(2));
  });
});
