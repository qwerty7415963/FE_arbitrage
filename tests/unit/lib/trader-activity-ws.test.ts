import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildActivityWsUrl,
  connectTradeActivityWS,
  getReconnectDelayMs,
  ACTIVITY_WS_PING_INTERVAL_MS,
} from '@/lib/trader-activity-ws';
import type {
  ActivityFill,
  PositionSnapshot,
  WalletConnectionStatus,
  WalletFundingEvent,
  WalletOrderEvent,
  ActivityTrade,
} from '@/types/trader';

class FakeWS {
  static instances: FakeWS[] = [];
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSED = 3;
  url: string;
  readyState = 0;
  sent: string[] = [];
  onopen: ((ev: unknown) => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onclose: ((ev: unknown) => void) | null = null;
  onerror: ((ev: unknown) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeWS.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = FakeWS.CLOSED;
  }

  open(): void {
    this.readyState = FakeWS.OPEN;
    this.onopen?.({});
  }

  receive(msg: unknown): void {
    this.onmessage?.({ data: JSON.stringify(msg) });
  }

  triggerClose(): void {
    this.onclose?.({});
  }
}

const fill = {
  coin: 'ETH',
  side: 'BUY',
  size: 1.2,
  price: 2309.1,
  time: '2026-10-08T00:00:00Z',
  tid: 1101266132350103,
};

describe('buildActivityWsUrl', () => {
  it('builds a ws url and lowercases the wallet', () => {
    expect(buildActivityWsUrl('0xABCDEF', { protocol: 'http:', host: 'example.com' })).toBe(
      'ws://example.com/api/v1/traders/ws?wallet=0xabcdef',
    );
  });

  it('uses wss for https locations', () => {
    expect(buildActivityWsUrl('0xabc', { protocol: 'https:', host: 'example.com' })).toBe(
      'wss://example.com/api/v1/traders/ws?wallet=0xabc',
    );
  });
});

describe('getReconnectDelayMs', () => {
  it('backs off 1s, 2s, 4s and caps at 30s', () => {
    expect(getReconnectDelayMs(0)).toBe(1000);
    expect(getReconnectDelayMs(1)).toBe(2000);
    expect(getReconnectDelayMs(2)).toBe(4000);
    expect(getReconnectDelayMs(10)).toBe(30000);
  });
});

describe('connectTradeActivityWS (contract v1.2 §2 wallet.* envelope)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeWS.instances = [];
    vi.stubGlobal('WebSocket', FakeWS);
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('routes legacy activity messages to onFill and reports connected', () => {
    const fills: ActivityFill[] = [];
    const statuses: string[] = [];
    const handle = connectTradeActivityWS(
      '0xABC',
      (f) => fills.push(f),
      (s) => statuses.push(s),
    );
    expect(FakeWS.instances).toHaveLength(1);
    expect(FakeWS.instances[0].url).toContain('wallet=0xabc');

    FakeWS.instances[0].open();
    expect(statuses).toContain('connected');

    FakeWS.instances[0].receive({
      type: 'activity',
      data: {
        coin: 'BTC',
        side: 'BUY',
        size: 0.1,
        price: 60000,
        time: '2026-10-06T09:01:00Z',
        tid: 1,
      },
    });
    expect(fills).toHaveLength(1);
    expect(fills[0].coin).toBe('BTC');

    FakeWS.instances[0].receive({ type: 'subscribed', data: { wallet: '0xabc' } });
    expect(fills).toHaveLength(1);

    handle.close();
  });

  it('routes wallet.fill.created to onFill without refetch', () => {
    const fills: ActivityFill[] = [];
    const handle = connectTradeActivityWS('0xabc', (f) => fills.push(f));
    FakeWS.instances[0].open();
    FakeWS.instances[0].receive({ type: 'wallet.fill.created', data: fill });
    expect(fills).toHaveLength(1);
    expect(fills[0].tid).toBe(1101266132350103);
    handle.close();
  });

  it('routes wallet.funding.created to onFunding', () => {
    const fundings: WalletFundingEvent[] = [];
    const handle = connectTradeActivityWS('0xabc', () => {}, undefined, {
      onFunding: (f) => fundings.push(f),
    });
    FakeWS.instances[0].open();
    FakeWS.instances[0].receive({
      type: 'wallet.funding.created',
      data: { coin: 'ETH', usdc: -3.44, time: '2026-10-08T00:00:00Z' },
    });
    expect(fundings).toHaveLength(1);
    expect(fundings[0].usdc).toBe(-3.44);
    handle.close();
  });

  it('routes wallet.order.updated to onOrder', () => {
    const orders: WalletOrderEvent[] = [];
    const handle = connectTradeActivityWS('0xabc', () => {}, undefined, {
      onOrder: (o) => orders.push(o),
    });
    FakeWS.instances[0].open();
    FakeWS.instances[0].receive({
      type: 'wallet.order.updated',
      data: { coin: 'BTC', oid: 91490942, status: 'open' },
    });
    expect(orders).toHaveLength(1);
    expect(orders[0].oid).toBe(91490942);
    handle.close();
  });

  it('routes wallet.position.updated to onPosition', () => {
    const snapshots: PositionSnapshot[] = [];
    const handle = connectTradeActivityWS('0xabc', () => {}, undefined, {
      onPosition: (s) => snapshots.push(s),
    });
    FakeWS.instances[0].open();
    FakeWS.instances[0].receive({
      type: 'wallet.position.updated',
      data: {
        summary: null,
        positions: [],
        data_status: 'ready',
        as_of: '2026-10-08T00:00:00Z',
      },
    });
    expect(snapshots).toHaveLength(1);
    handle.close();
  });

  it('routes wallet.activity.created to onActivity', () => {
    const trades: ActivityTrade[] = [];
    const handle = connectTradeActivityWS('0xabc', () => {}, undefined, {
      onActivity: (t) => trades.push(t),
    });
    FakeWS.instances[0].open();
    FakeWS.instances[0].receive({
      type: 'wallet.activity.created',
      data: {
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
        funding: -12.5,
        net_pnl: 1470,
        fills: 3,
      },
    });
    expect(trades).toHaveLength(1);
    expect(trades[0].funding).toBe(-12.5);
    expect(trades[0].net_pnl).toBe(1470);
    handle.close();
  });

  it.each([
    'DISCONNECTED',
    'RECONNECTING',
    'RESYNCING',
    'RECONCILING',
    'LIVE',
    'ERROR',
  ] as WalletConnectionStatus[])('routes wallet.connection.updated %s', (status) => {
    const states: WalletConnectionStatus[] = [];
    const handle = connectTradeActivityWS('0xabc', () => {}, undefined, {
      onConnection: (s) => states.push(s),
    });
    FakeWS.instances[0].open();
    FakeWS.instances[0].receive({ type: 'wallet.connection.updated', data: { status } });
    expect(states).toEqual([status]);
    handle.close();
  });

  it('ignores malformed envelopes and legacy ping/pong without crashing', () => {
    const fills: ActivityFill[] = [];
    const handle = connectTradeActivityWS('0xabc', (f) => fills.push(f));
    FakeWS.instances[0].open();
    FakeWS.instances[0].receive({ type: 'wallet.fill.created', data: { coin: 'ETH' } });
    FakeWS.instances[0].receive({ type: 'ping' });
    FakeWS.instances[0].receive({ type: 'pong' });
    FakeWS.instances[0].receive({ type: 'wallet.state.updated', data: {} });
    FakeWS.instances[0].receive('not-json{{{');
    expect(fills).toHaveLength(0);
    handle.close();
  });

  it('ignores messages after close (listener cleanup)', () => {
    const fills: ActivityFill[] = [];
    const handle = connectTradeActivityWS('0xabc', (f) => fills.push(f));
    FakeWS.instances[0].open();
    handle.close();
    FakeWS.instances[0].receive({ type: 'wallet.fill.created', data: fill });
    expect(fills).toHaveLength(0);
  });

  it('sends ping every 25s while open', () => {
    const handle = connectTradeActivityWS('0xabc', () => {});
    FakeWS.instances[0].open();
    expect(ACTIVITY_WS_PING_INTERVAL_MS).toBe(25000);
    vi.advanceTimersByTime(25000);
    expect(FakeWS.instances[0].sent).toContain(JSON.stringify({ type: 'ping' }));
    handle.close();
  });

  it('reconnects with backoff after close', () => {
    const statuses: string[] = [];
    const handle = connectTradeActivityWS(
      '0xabc',
      () => {},
      (s) => statuses.push(s),
    );
    FakeWS.instances[0].open();
    FakeWS.instances[0].triggerClose();
    expect(statuses).toContain('reconnecting');
    expect(FakeWS.instances).toHaveLength(1);
    vi.advanceTimersByTime(1000);
    expect(FakeWS.instances).toHaveLength(2);
    handle.close();
  });

  it('closes the socket when the tab hides and reconnects on visible (M4)', () => {
    const statuses: string[] = [];
    const handle = connectTradeActivityWS(
      '0xabc',
      () => {},
      (s) => statuses.push(s),
    );
    FakeWS.instances[0].open();

    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(statuses).toContain('disconnected');

    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(FakeWS.instances.length).toBeGreaterThanOrEqual(2);
    handle.close();
  });
});
