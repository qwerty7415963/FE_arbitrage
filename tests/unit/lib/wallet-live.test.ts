import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { connectWalletLive, subscribeWalletLive } from '@/lib/wallet-live';

class FakeWS {
  static instances: FakeWS[] = [];
  static OPEN = 1;
  url: string;
  readyState = 0;
  onopen: ((ev: unknown) => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onclose: ((ev: unknown) => void) | null = null;
  onerror: ((ev: unknown) => void) | null = null;
  constructor(url: string) {
    this.url = url;
    FakeWS.instances.push(this);
  }
  send() {}
  close() {
    this.readyState = 3;
  }
  open() {
    this.readyState = 1;
    this.onopen?.({});
  }
  receive(msg: unknown) {
    this.onmessage?.({ data: JSON.stringify(msg) });
  }
}

describe('wallet-live', () => {
  beforeEach(() => {
    FakeWS.instances = [];
    vi.stubGlobal('WebSocket', FakeWS);
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses one socket per wallet with refcount', () => {
    const h1 = connectWalletLive('0xABC');
    const h2 = connectWalletLive('0xABC');
    expect(FakeWS.instances).toHaveLength(1);
    h1.close();
    // socket still open due to h2
    expect(FakeWS.instances).toHaveLength(1);
    h2.close();
  });

  it('fans out messages to subscribers', () => {
    const cb = vi.fn();
    const unsub = subscribeWalletLive('0xDEF', ['positions'], { onPosition: cb });
    FakeWS.instances[0].open();
    FakeWS.instances[0].receive({
      type: 'wallet.position.updated',
      data: { positions: [], data_status: 'ready', as_of: null, summary: null },
    });
    expect(cb).toHaveBeenCalled();
    unsub();
  });

  it('handles wallet.dropped by marking dirty', () => {
    const handle = connectWalletLive('0x123');
    FakeWS.instances[0].open();
    FakeWS.instances[0].receive({ type: 'wallet.dropped', data: { channel: 'positions', seq: 5 } });
    expect(handle.isDirty('positions')).toBe(true);
    handle.clearDirty('positions');
    expect(handle.isDirty('positions')).toBe(false);
    handle.close();
  });

  it('routes bootstrap to onBootstrap', () => {
    const cb = vi.fn();
    const unsub = subscribeWalletLive('0x999', ['activity'], { onBootstrap: cb });
    FakeWS.instances[0].open();
    FakeWS.instances[0].receive({ type: 'wallet.bootstrap.activity', data: { fills: [] } });
    expect(cb).toHaveBeenCalledWith('activity', { fills: [] });
    unsub();
  });
});
