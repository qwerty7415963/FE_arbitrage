import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTraderActivity } from '@/hooks/use-trader-activity';
import { fetchTraderActivity } from '@/services/traders';
import { connectTradeActivityWS } from '@/lib/trader-activity-ws';
import type { ActivityFill, ActivityTrade, WalletOrderEvent } from '@/types/trader';

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

const WALLET = '0xABCDEF123456789012345678901234567890ABCD';
const WALLET_LOWER = WALLET.toLowerCase();

type WsCall = {
  onFill: (fill: ActivityFill) => void;
  onStatus?: (status: 'connected' | 'disconnected' | 'reconnecting') => void;
  handlers: {
    onOrderCreated?: (order: WalletOrderEvent) => void;
    onActivity?: (trade: ActivityTrade) => void;
    onConnection?: (status: never) => void;
  };
};

function lastWsCall(): WsCall {
  const calls = vi.mocked(connectTradeActivityWS).mock.calls;
  const last = calls[calls.length - 1] as unknown[];
  return {
    onFill: last[1] as WsCall['onFill'],
    onStatus: last[2] as WsCall['onStatus'],
    handlers: (last[3] ?? {}) as WsCall['handlers'],
  };
}

const limitOrder: WalletOrderEvent = {
  coin: 'BTC',
  oid: 91490942,
  status: 'open',
  side: 'BUY',
  limit_px: 60000,
  size: 0.5,
  timestamp: '2026-10-08T00:02:00Z',
};

const openFill: ActivityFill = {
  coin: 'ETH',
  side: 'BUY',
  size: 1.2,
  price: 2309.1,
  time: '2026-10-08T00:01:00Z',
  tid: 1101266132350103,
  dir: 'Open Long',
};

const closeCycle: ActivityTrade = {
  market: 'SOL',
  side: 'SHORT',
  opened_at: '2026-10-04T00:00:00Z',
  closed_at: '2026-10-08T00:00:00Z',
  duration_sec: 86400,
  volume: 5000,
  entry_price: 100,
  exit_price: 90,
  pnl: 200,
  fees: 5,
  funding: 1.5,
  net_pnl: 195,
  fills: 2,
};

describe('useTraderActivity (SIDEBAR-3EVENTS WS-only)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(connectTradeActivityWS).mockReturnValue({ close: vi.fn() });
  });

  it('never calls REST and starts disconnected-loading', async () => {
    const { result } = renderHook(() => useTraderActivity(WALLET), { wrapper });
    expect(vi.mocked(connectTradeActivityWS).mock.calls[0][0]).toBe(WALLET_LOWER);
    expect(vi.mocked(fetchTraderActivity)).not.toHaveBeenCalled();
    expect(result.current.items).toEqual([]);
    expect(result.current.live).toBe('disconnected');
    expect(result.current.connection).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('merges limit + open fill + close sorted time DESC', async () => {
    const { result } = renderHook(() => useTraderActivity(WALLET), { wrapper });
    const ws = lastWsCall();
    act(() => {
      ws.onStatus?.('connected');
      ws.handlers.onOrderCreated?.(limitOrder);
      ws.onFill(openFill);
      ws.handlers.onActivity?.(closeCycle);
    });
    await waitFor(() => expect(result.current.items).toHaveLength(3));
    expect(result.current.isLoading).toBe(false);
    // close 00:00 (10-08) is oldest, limit 00:02 newest → limit first.
    expect(result.current.items[0].kind).toBe('limit');
    expect(result.current.items[1].kind).toBe('fill');
    expect(result.current.items[2].kind).toBe('close');
    expect(result.current.items[0].time).toBe('2026-10-08T00:02:00Z');
    expect(vi.mocked(fetchTraderActivity)).not.toHaveBeenCalled();
  });

  it('skips Close-direction fills (cycle represents them)', async () => {
    const { result } = renderHook(() => useTraderActivity(WALLET), { wrapper });
    const ws = lastWsCall();
    act(() => {
      ws.onStatus?.('connected');
      ws.onFill({ ...openFill, tid: 1, dir: 'Close Long' });
      ws.onFill({ ...openFill, tid: 2, dir: 'close short' });
      ws.onFill({ ...openFill, tid: 3, dir: 'Open Short' });
    });
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0].kind).toBe('fill');
    if (result.current.items[0].kind === 'fill') {
      expect(result.current.items[0].fill.tid).toBe(3);
    }
  });

  it('caps the merged timeline at 50 (newest kept)', async () => {
    const { result } = renderHook(() => useTraderActivity(WALLET), { wrapper });
    const ws = lastWsCall();
    act(() => {
      ws.onStatus?.('connected');
      for (let i = 0; i < 60; i += 1) {
        const minute = String(i).padStart(2, '0');
        ws.onFill({
          ...openFill,
          tid: 1000 + i,
          time: `2026-10-08T00:${minute}:00Z`,
          dir: 'Open Long',
        });
      }
    });
    await waitFor(() => expect(result.current.items).toHaveLength(50));
    expect(result.current.items).toHaveLength(50);
  });

  it('keeps WS status/reconnect surface (live + connection)', async () => {
    const { result } = renderHook(() => useTraderActivity(WALLET), { wrapper });
    const ws = lastWsCall();
    act(() => {
      ws.onStatus?.('reconnecting');
      ws.handlers.onConnection?.('RECONNECTING' as never);
    });
    await waitFor(() => expect(result.current.live).toBe('reconnecting'));
    expect(result.current.connection).toBe('RECONNECTING');
    expect(result.current.isLoading).toBe(true);
    act(() => {
      ws.onStatus?.('connected');
      ws.handlers.onConnection?.('LIVE' as never);
    });
    await waitFor(() => expect(result.current.live).toBe('connected'));
    expect(result.current.connection).toBe('LIVE');
    expect(result.current.isLoading).toBe(false);
  });
});
