import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTraderPositions } from '@/hooks/use-trader-positions';
import { useTraderTrades } from '@/hooks/use-trader-trades';
import { useTraderActivity } from '@/hooks/use-trader-activity';
import { fetchTraderActivity, fetchTraderPositions } from '@/services/traders';
import { SYNC_POLL_INTERVAL_MS, SYNC_POLL_MAX_ATTEMPTS } from '@/lib/trader-sync';

vi.mock('@/services/traders', () => ({
  fetchTraderPositions: vi.fn(),
  fetchTraderActivity: vi.fn(),
}));

vi.mock('@/lib/trader-activity-ws', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/trader-activity-ws')>();
  return {
    ...actual,
    connectTradeActivityWS: vi.fn(() => ({ close: vi.fn() })),
  };
});

const WALLET = '0xABCDEF123456789012345678901234567890ABCD';

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const syncingPositions = {
  summary: null,
  positions: [],
  data_status: 'syncing' as const,
  as_of: null,
};

const readyPositions = {
  summary: null,
  positions: [],
  data_status: 'ready' as const,
  as_of: null,
};

const syncingActivity = {
  rows: [],
  next_cursor: null,
  has_more: false,
  counts: { win: 0, loss: 0, long: 0, short: 0, total: 0 },
  data_status: 'syncing' as const,
};

async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

async function advancePolls(count: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(SYNC_POLL_INTERVAL_MS * count);
  });
}

describe('sync polling (contract v1.1 §4 F2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('polls positions while syncing and stops once ready', async () => {
    vi.mocked(fetchTraderPositions)
      .mockResolvedValueOnce(syncingPositions)
      .mockResolvedValue(readyPositions);

    renderHook(() => useTraderPositions(WALLET), { wrapper });
    await flush();
    expect(fetchTraderPositions).toHaveBeenCalledTimes(1);

    await advancePolls(1);
    expect(fetchTraderPositions).toHaveBeenCalledTimes(2);

    // Ready ⇒ no further polls.
    await advancePolls(5);
    expect(fetchTraderPositions).toHaveBeenCalledTimes(2);
  });

  it('caps positions polling at ~8 attempts (~2 minutes)', async () => {
    vi.mocked(fetchTraderPositions).mockResolvedValue(syncingPositions);

    renderHook(() => useTraderPositions(WALLET), { wrapper });
    await flush();
    await advancePolls(20);

    expect(vi.mocked(fetchTraderPositions).mock.calls.length).toBe(SYNC_POLL_MAX_ATTEMPTS);
  });

  it('does not poll positions that are ready on first load', async () => {
    vi.mocked(fetchTraderPositions).mockResolvedValue(readyPositions);

    renderHook(() => useTraderPositions(WALLET), { wrapper });
    await flush();
    await advancePolls(5);

    expect(fetchTraderPositions).toHaveBeenCalledTimes(1);
  });

  it('useTraderTrades exposes the activity data_status (ready by default)', async () => {
    vi.mocked(fetchTraderActivity).mockResolvedValue({
      rows: [],
      next_cursor: null,
      has_more: false,
      counts: { win: 0, loss: 0, long: 0, short: 0, total: 0 },
    });

    const { result } = renderHook(() => useTraderTrades(WALLET), { wrapper });
    await flush();
    expect(result.current.dataStatus).toBe('ready');
  });

  it('useTraderTrades polls while the activity is syncing', async () => {
    vi.mocked(fetchTraderActivity)
      .mockResolvedValueOnce(syncingActivity)
      .mockResolvedValue({ ...syncingActivity, data_status: 'ready' as const });

    const { result } = renderHook(() => useTraderTrades(WALLET), { wrapper });
    await flush();
    expect(result.current.dataStatus).toBe('syncing');
    expect(fetchTraderActivity).toHaveBeenCalledTimes(1);

    await advancePolls(1);
    expect(fetchTraderActivity).toHaveBeenCalledTimes(2);

    await advancePolls(5);
    expect(fetchTraderActivity).toHaveBeenCalledTimes(2);
  });

  it('useTraderActivity exposes the syncing signal for Recent Activity', async () => {
    vi.mocked(fetchTraderActivity).mockResolvedValue(syncingActivity);

    const { result } = renderHook(() => useTraderActivity(WALLET), { wrapper });
    await flush();
    expect(result.current.dataStatus).toBe('syncing');
  });
});
