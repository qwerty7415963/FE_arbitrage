import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildActivityWsUrl,
  connectTradeActivityWS,
  getReconnectDelayMs,
  ACTIVITY_WS_PING_INTERVAL_MS,
} from '@/lib/trader-activity-ws';
import type { ActivityFill } from '@/types/trader';

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

describe('connectTradeActivityWS', () => {
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

  it('routes activity messages to onFill and reports connected', () => {
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
