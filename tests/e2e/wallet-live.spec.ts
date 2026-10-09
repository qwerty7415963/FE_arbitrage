import { test, expect, type Page } from '@playwright/test';

// Contract v1.2 live fixtures (LIVE-FIXTURES.md). No invented fields.
// data_status is ONLY ready|error; activity rows carry funding;
// net_pnl = pnl − fees is unchanged.
const WALLET = '0x1111111111111111111111111111111111111111';

const mockDetail = {
  registry: {
    wallet_address: WALLET,
    venue: 'hyperliquid',
    venue_id: null,
    display_name: 'Live Wallet',
    discovery_source: 'leaderboard',
    first_seen_at: '2024-01-01T00:00:00Z',
    last_seen_at: '2024-01-02T00:00:00Z',
    last_trade_at: '2024-01-02T00:00:00Z',
    leaderboard_seen_at: null,
    status: 'active',
  },
  metrics: {
    wallet_address: WALLET,
    venue: 'hyperliquid',
    venue_id: null,
    period: '30D',
    display_name: 'Live Wallet',
    pnl: 5000,
    realized_pnl: 5000,
    roi: 25,
    win_rate: 70,
    volume: 100000,
    trade_count: 50,
    profit_factor: 2.1,
    max_drawdown_pct: null,
    long_count: 30,
    long_wins: 24,
    short_count: 20,
    short_wins: 10,
    gross_profit: null,
    gross_loss: null,
    avg_trade_pnl: null,
    avg_holding_time_sec: null,
    last_trade_at: '2024-01-02T00:00:00Z',
    data_status: 'ready',
    is_partial: false,
    metrics_as_of: '2024-01-02T01:00:00Z',
    calculation_version: 1,
  },
  period: '30D',
};

const mockPositions = {
  summary: {
    account_value: 12345.67,
    total_ntl_pos: 5000.0,
    total_margin_used: 800.0,
    as_of: '2026-10-08T00:00:00Z',
  },
  positions: [
    {
      coin: 'BTC',
      side: 'LONG',
      size: 0.5,
      entry_price: 60000.0,
      mark_price: 61000.0,
      position_value: 30500.0,
      unrealized_pnl: 500.0,
      return_on_equity: 0.12,
      liquidation_price: 45000.0,
      leverage: 10.0,
      max_leverage: 40.0,
      margin_used: 3050.0,
      as_of: '2026-10-08T00:00:00Z',
    },
  ],
  data_status: 'ready',
  as_of: '2026-10-08T00:00:00Z',
};

const btcTrade = {
  market: 'BTC',
  side: 'LONG',
  opened_at: '2026-10-01T00:00:00Z',
  closed_at: '2026-10-03T12:00:00Z',
  duration_sec: 216000,
  volume: 30500.0,
  entry_price: 60000.0,
  exit_price: 62000.0,
  pnl: 1500.0,
  fees: 30.0,
  funding: -12.5,
  net_pnl: 1470.0,
  fills: 3,
};

const mockActivity = {
  rows: [btcTrade],
  next_cursor: null,
  has_more: false,
  counts: { win: 1, loss: 0, long: 1, short: 0, total: 1 },
  data_status: 'ready',
  as_of: '2026-10-08T00:00:00Z',
  partial: false,
};

async function seedAuthAndWs(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'test-token');
    localStorage.setItem('refresh_token', 'test-refresh');
    const RealWS = window.WebSocket;
    const win = window as unknown as Record<string, unknown>;
    const instances: Array<{
      onopen: ((ev: unknown) => void) | null;
      onmessage: ((ev: { data: string }) => void) | null;
    }> = [];
    win.__wsInstances = instances;
    win.__wsBroadcast = (msg: unknown) => {
      for (const ws of instances) ws.onmessage?.({ data: JSON.stringify(msg) });
    };
    class FakeWS {
      static OPEN = 1;
      static CONNECTING = 0;
      static CLOSING = 2;
      static CLOSED = 3;
      url = '';
      readyState = 0;
      sent: string[] = [];
      onopen: ((ev: unknown) => void) | null = null;
      onmessage: ((ev: { data: string }) => void) | null = null;
      onclose: ((ev: unknown) => void) | null = null;
      onerror: ((ev: unknown) => void) | null = null;
      constructor(url: string, protocols?: string | string[]) {
        // Delegate non-wallet sockets (Next HMR) to the real WebSocket so
        // the dev overlay never sees the stub. Only /traders/ws is faked.
        if (typeof url === 'string' && !url.includes('/traders/ws')) {
          return new RealWS(url, protocols as never) as unknown as FakeWS;
        }
        this.url = url;
        instances.push(this);
        setTimeout(() => {
          this.readyState = 1;
          this.onopen?.({});
        }, 0);
      }
      send(data: string): void {
        this.sent.push(data);
      }
      close(): void {
        this.readyState = 3;
      }
      addEventListener(): void {}
      removeEventListener(): void {}
    }
    window.WebSocket = FakeWS as unknown as typeof WebSocket;
  });
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { id: 'u1', email: 't@t.com', role: 'user', status: 'active', created_at: '' },
      }),
    }),
  );
}

interface Counters {
  activity: number;
  positions: number;
  syncPosts: number;
}

async function mockLiveWallet(page: Page, counters: Counters) {
  await page.route('**/api/v1/traders/**', (route) => {
    const url = new URL(route.request().url());
    const ok = (data: unknown) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data }),
      });
    if (route.request().method() === 'POST' && url.pathname.endsWith('/sync')) {
      counters.syncPosts += 1;
      return route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { status: 'queued' } }),
      });
    }
    if (url.pathname.endsWith('/positions')) {
      counters.positions += 1;
      return ok(mockPositions);
    }
    if (url.pathname.endsWith('/activity')) {
      counters.activity += 1;
      return ok(mockActivity);
    }
    return ok(mockDetail);
  });
  await page.route('**/api/v1/trader-groups', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    }),
  );
}

async function broadcast(page: Page, msg: unknown) {
  await page.evaluate(
    (m) => (window as unknown as { __wsBroadcast: (msg: unknown) => void }).__wsBroadcast(m),
    msg,
  );
}

test.describe('Wallet live (contract v1.2 wallet.* envelope)', () => {
  test('L1 trades show FUNDING with net unchanged, as_of, and never POST /sync', async ({
    page,
  }) => {
    const counters: Counters = { activity: 0, positions: 0, syncPosts: 0 };
    await seedAuthAndWs(page);
    await mockLiveWallet(page, counters);
    await page.goto(`/en/traders/${WALLET}?tab=trades`);
    const panel = page.locator('#wallet-panel-trades');
    await expect(panel.getByText('BTC').first()).toBeVisible();
    await expect(panel.getByText('-$12.5')).toBeVisible();
    await expect(panel.getByText('+$1,470')).toBeVisible();
    await expect(panel.getByText(/As of/)).toBeVisible();
    expect(counters.syncPosts).toBe(0);
  });

  test('L2 wallet.fill.created prepends a live fill without refetching activity', async ({
    page,
  }) => {
    const counters: Counters = { activity: 0, positions: 0, syncPosts: 0 };
    await seedAuthAndWs(page);
    await mockLiveWallet(page, counters);
    await page.goto(`/en/traders/${WALLET}`);
    await expect(page.getByRole('heading', { name: 'Live Wallet' })).toBeVisible();
    await expect(page.getByText('BTC').first()).toBeVisible();
    const before = counters.activity;
    await broadcast(page, {
      type: 'wallet.fill.created',
      data: {
        coin: 'ETH',
        side: 'BUY',
        size: 1.2,
        price: 2309.1,
        time: '2026-10-08T00:00:00Z',
        tid: 1101266132350103,
      },
    });
    const feed = page.getByRole('region', { name: 'Recent Activity' });
    await expect(feed.getByText('ETH').first()).toBeVisible();
    await expect(feed.getByText('$2.31K').first()).toBeVisible();
    expect(counters.activity).toBe(before);
    expect(counters.syncPosts).toBe(0);
  });

  test('L3 wallet.funding.created patches FUNDING without refetching', async ({ page }) => {
    const counters: Counters = { activity: 0, positions: 0, syncPosts: 0 };
    await seedAuthAndWs(page);
    await mockLiveWallet(page, counters);
    await page.goto(`/en/traders/${WALLET}?tab=trades`);
    const panel = page.locator('#wallet-panel-trades');
    await expect(panel.getByText('-$12.5')).toBeVisible();
    const before = counters.activity;
    // In-window funding for the BTC trade (open 10-01, close 10-03).
    await broadcast(page, {
      type: 'wallet.funding.created',
      data: { coin: 'BTC', usdc: -3.44, time: '2026-10-02T00:00:00Z' },
    });
    await expect(panel.getByText('-$15.94')).toBeVisible();
    // Net is unchanged by funding attribution.
    await expect(panel.getByText('+$1,470')).toBeVisible();
    expect(counters.activity).toBe(before);
  });

  test('L4 wallet.connection.updated states gate the LIVE badge', async ({ page }) => {
    const counters: Counters = { activity: 0, positions: 0, syncPosts: 0 };
    await seedAuthAndWs(page);
    await mockLiveWallet(page, counters);
    await page.goto(`/en/traders/${WALLET}`);
    await expect(page.getByRole('heading', { name: 'Live Wallet' })).toBeVisible();
    const feed = page.getByRole('region', { name: 'Recent Activity' });
    for (const status of ['DISCONNECTED', 'RECONNECTING', 'RESYNCING', 'RECONCILING', 'ERROR']) {
      await broadcast(page, { type: 'wallet.connection.updated', data: { status } });
      await expect(feed.getByText('LIVE')).toHaveCount(0);
    }
    await broadcast(page, { type: 'wallet.connection.updated', data: { status: 'LIVE' } });
    await expect(feed.getByText('LIVE').first()).toBeVisible();
  });

  test('L5 wallet.position.updated patches positions without refetching', async ({ page }) => {
    const counters: Counters = { activity: 0, positions: 0, syncPosts: 0 };
    await seedAuthAndWs(page);
    await mockLiveWallet(page, counters);
    await page.goto(`/en/traders/${WALLET}`);
    await expect(page.getByText('BTC').first()).toBeVisible();
    const before = counters.positions;
    await broadcast(page, {
      type: 'wallet.position.updated',
      data: {
        summary: {
          account_value: 20000,
          total_ntl_pos: 9000,
          total_margin_used: 1000,
          as_of: '2026-10-08T01:00:00Z',
        },
        positions: [],
        data_status: 'ready',
        as_of: '2026-10-08T01:00:00Z',
      },
    });
    await expect(page.getByText('No open positions')).toBeVisible();
    expect(counters.positions).toBe(before);
  });

  test('L6 wallet.activity.created prepends a trade without refetching', async ({ page }) => {
    const counters: Counters = { activity: 0, positions: 0, syncPosts: 0 };
    await seedAuthAndWs(page);
    await mockLiveWallet(page, counters);
    await page.goto(`/en/traders/${WALLET}?tab=trades`);
    const panel = page.locator('#wallet-panel-trades');
    await expect(panel.getByText('BTC').first()).toBeVisible();
    const before = counters.activity;
    await broadcast(page, {
      type: 'wallet.activity.created',
      data: {
        market: 'SOL',
        side: 'SHORT',
        opened_at: '2026-10-04T00:00:00Z',
        closed_at: '2026-10-05T00:00:00Z',
        duration_sec: 86400,
        volume: 5000,
        entry_price: 100,
        exit_price: 90,
        pnl: 200,
        fees: 5,
        funding: 1.5,
        net_pnl: 195,
        fills: 2,
      },
    });
    await expect(panel.getByText('SOL').first()).toBeVisible();
    expect(counters.activity).toBe(before);
  });

  test('L7 vietnamese locale renders asOf and funding labels', async ({ page }) => {
    const counters: Counters = { activity: 0, positions: 0, syncPosts: 0 };
    await seedAuthAndWs(page);
    await mockLiveWallet(page, counters);
    await page.goto(`/vi/traders/${WALLET}?tab=trades`);
    const panel = page.locator('#wallet-panel-trades');
    await expect(panel.getByText('BTC').first()).toBeVisible();
    await expect(panel.getByText('-$12.5')).toBeVisible();
    await expect(panel.getByText(/Lúc/)).toBeVisible();
    expect(counters.syncPosts).toBe(0);
  });
});
