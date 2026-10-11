import { test, expect, type Page } from '@playwright/test';

// SIDEBAR-3EVENTS (frozen delta over contract v1.2): sidebar is WS-only,
// three events (limit / open-fill / close), time DESC, cap 50. No REST
// (`/activity` counter stays 0), no fundings, Close-dir fills skipped.
const WALLET = '0x1234567890abcdef1234567890abcdef12345678';

const mockDetail = {
  registry: {
    wallet_address: WALLET,
    venue: 'hyperliquid',
    venue_id: null,
    display_name: 'Smart Money',
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
    display_name: 'Smart Money',
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
    account_value: 12345.6,
    total_ntl_pos: 5000,
    total_margin_used: 800,
    as_of: '2026-10-06T09:00:00Z',
  },
  positions: [
    {
      coin: 'BTC',
      side: 'LONG',
      size: 0.5,
      entry_price: 60000,
      mark_price: 63000,
      position_value: 31500,
      unrealized_pnl: 1500,
      return_on_equity: 0.05,
      liquidation_price: 55000,
      leverage: 3,
      max_leverage: 10,
      margin_used: 100,
      as_of: '2026-10-06T09:00:00Z',
    },
  ],
  data_status: 'ready',
  as_of: '2026-10-06T09:00:00Z',
};

const emptyActivity = {
  rows: [],
  next_cursor: null,
  has_more: false,
  counts: { win: 0, loss: 0, long: 0, short: 0, total: 0 },
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

async function mockTraderEndpoints(
  page: Page,
  counters: { activity: number },
  overrides: {
    detail?: unknown;
    positions?: unknown;
    positionsStatus?: number;
  } = {},
) {
  await page.route('**/api/v1/traders/**', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/positions')) {
      if (overrides.positionsStatus) {
        return route.fulfill({
          status: overrides.positionsStatus,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: { code: 'INTERNAL', message: 'boom' } }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: overrides.positions ?? mockPositions }),
      });
    }
    if (url.pathname.endsWith('/activity')) {
      counters.activity += 1;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: emptyActivity }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: overrides.detail ?? mockDetail }),
    });
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

test.describe('Trader Detail positions + sidebar 3-event (SIDEBAR-3EVENTS)', () => {
  test('renders positions table and a waiting sidebar', async ({ page }) => {
    const counters = { activity: 0 };
    await seedAuthAndWs(page);
    await mockTraderEndpoints(page, counters);
    await page.goto(`/en/traders/${WALLET}`);
    await expect(page.getByRole('heading', { name: 'Smart Money' })).toBeVisible();
    await expect(page.getByText('Open Positions')).toBeVisible();
    await expect(page.getByText('BTC').first()).toBeVisible();
    await expect(page.getByText('Recent Activity')).toBeVisible();
    await expect(page.getByText('Waiting for live activity…')).toBeVisible();
    expect(counters.activity).toBe(0);
  });

  test('shows empty positions with a waiting sidebar (no Load more)', async ({ page }) => {
    const counters = { activity: 0 };
    await seedAuthAndWs(page);
    await mockTraderEndpoints(page, counters, {
      positions: { summary: null, positions: [], data_status: 'ready', as_of: null },
    });
    await page.goto(`/en/traders/${WALLET}`);
    await expect(page.getByText('No open positions')).toBeVisible();
    await expect(page.getByText('Waiting for live activity…')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Load more' })).toHaveCount(0);
    expect(counters.activity).toBe(0);
  });

  test('shows Ready (never syncing) for live positions', async ({ page }) => {
    const counters = { activity: 0 };
    await seedAuthAndWs(page);
    await mockTraderEndpoints(page, counters, {
      positions: { summary: null, positions: [], data_status: 'ready', as_of: null },
    });
    await page.goto(`/en/traders/${WALLET}`);
    await expect(page.getByText('Ready').first()).toBeVisible();
    await expect(page.getByText('Syncing')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Sync now' })).toHaveCount(0);
    expect(counters.activity).toBe(0);
  });

  test('sidebar merges limit + open fill + close into 3 rows, ignores fundings, never calls /activity', async ({
    page,
  }) => {
    const counters = { activity: 0 };
    await seedAuthAndWs(page);
    await mockTraderEndpoints(page, counters);
    await page.goto(`/en/traders/${WALLET}`);
    await expect(page.getByRole('heading', { name: 'Smart Money' })).toBeVisible();
    const feed = page.getByRole('region', { name: 'Recent Activity' });
    await expect(feed.getByText('Waiting for live activity…')).toBeVisible();

    await broadcast(page, {
      type: 'wallet.order.created',
      data: {
        coin: 'BTC',
        oid: 91490942,
        status: 'open',
        side: 'BUY',
        limit_px: 60000,
        size: 0.5,
        timestamp: '2026-10-08T00:02:00Z',
      },
    });
    await broadcast(page, {
      type: 'wallet.fill.created',
      data: {
        coin: 'ETH',
        side: 'BUY',
        size: 1.2,
        price: 2309.1,
        time: '2026-10-08T00:01:00Z',
        tid: 1101266132350103,
        dir: 'Open Long',
      },
    });
    await broadcast(page, {
      type: 'wallet.activity.created',
      data: {
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
      },
    });

    await expect(feed.getByText('LIMIT')).toBeVisible();
    await expect(feed.getByText('BTC').first()).toBeVisible();
    await expect(feed.getByText('LONG')).toBeVisible();
    await expect(feed.getByText('ETH').first()).toBeVisible();
    await expect(feed.getByText('CLOSED')).toBeVisible();
    await expect(feed.getByText('SOL').first()).toBeVisible();
    await expect(feed.getByText('+$195', { exact: true })).toBeVisible();
    await expect(feed.locator('li')).toHaveCount(3);
    expect(counters.activity).toBe(0);

    // Funding frames never render in the sidebar (C3).
    await broadcast(page, {
      type: 'wallet.funding.created',
      data: { coin: 'ETH', usdc: -3.44, time: '2026-10-08T00:00:00Z' },
    });
    await expect(feed.locator('li')).toHaveCount(3);
    await expect(feed.getByText('-$3.44')).toHaveCount(0);
    expect(counters.activity).toBe(0);
  });

  test('sidebar skips Close-direction fills (cycle represents them)', async ({ page }) => {
    const counters = { activity: 0 };
    await seedAuthAndWs(page);
    await mockTraderEndpoints(page, counters);
    await page.goto(`/en/traders/${WALLET}`);
    const feed = page.getByRole('region', { name: 'Recent Activity' });
    await expect(feed.getByText('Waiting for live activity…')).toBeVisible();
    await broadcast(page, {
      type: 'wallet.fill.created',
      data: {
        coin: 'ETH',
        side: 'SELL',
        size: 0.25,
        price: 3000,
        time: '2026-10-08T00:01:00Z',
        tid: 999,
        dir: 'Close Long',
      },
    });
    await expect(feed.getByText('Waiting for live activity…')).toBeVisible();
    await expect(feed.locator('li')).toHaveCount(0);
    expect(counters.activity).toBe(0);
  });

  test('keeps overview visible when positions fail', async ({ page }) => {
    const counters = { activity: 0 };
    await seedAuthAndWs(page);
    await mockTraderEndpoints(page, counters, { positionsStatus: 500 });
    await page.goto(`/en/traders/${WALLET}`);
    await expect(page.getByRole('heading', { name: 'Smart Money' })).toBeVisible();
    await expect(page.getByText('Open Positions')).toBeVisible();
  });

  test('polls overview + positions every 30s, inactive tabs stay silent', async ({ page }) => {
    test.setTimeout(90_000);
    const counters = { activity: 0 };
    await seedAuthAndWs(page);
    let detail = 0;
    let positions = 0;
    let balances = 0;
    await page.route('**/api/v1/traders/**', (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/positions')) {
        positions += 1;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: mockPositions }),
        });
      }
      if (url.pathname.endsWith('/balances')) {
        balances += 1;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { perp: null, spot: null, data_status: 'ready' },
          }),
        });
      }
      if (url.pathname.endsWith('/activity')) {
        counters.activity += 1;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: emptyActivity }),
        });
      }
      detail += 1;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockDetail }),
      });
    });
    await page.route('**/api/v1/trader-groups', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      }),
    );

    await page.goto(`/en/traders/${WALLET}`);
    await expect(page.getByRole('heading', { name: 'Smart Money' })).toBeVisible();
    await expect(page.getByText('BTC').first()).toBeVisible();
    expect(detail).toBeGreaterThanOrEqual(1);
    expect(positions).toBeGreaterThanOrEqual(1);
    expect(balances).toBe(0);

    await page.waitForResponse((r) => r.url().includes('/positions'), { timeout: 35_000 });
    expect(positions).toBeGreaterThanOrEqual(2);
    expect(balances).toBe(0);
    await page.waitForResponse(
      (r) => r.url().includes('/api/v1/traders/') && !r.url().includes('/positions'),
      { timeout: 35_000 },
    );
    expect(detail).toBeGreaterThanOrEqual(2);
    expect(balances).toBe(0);
    // Sidebar is WS-only: no durable /activity reads from the detail page.
    expect(counters.activity).toBe(0);
  });
});
