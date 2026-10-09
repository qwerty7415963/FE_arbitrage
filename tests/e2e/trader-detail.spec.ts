import { test, expect, type Page } from '@playwright/test';

// Contract v1.2 fixtures (LIVE-FIXTURES.md). No invented fields.
// data_status is ONLY ready|error; activity rows carry funding;
// net_pnl = pnl − fees is unchanged.
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

const mockActivityPage1 = {
  rows: [
    {
      market: 'BTC',
      side: 'LONG',
      opened_at: '2026-10-01T00:00:00Z',
      closed_at: '2026-10-03T12:00:00Z',
      duration_sec: 216000,
      volume: 30000,
      entry_price: 60000,
      exit_price: 62000,
      pnl: 1500,
      fees: 30,
      funding: -12.5,
      net_pnl: 1470,
      fills: 3,
    },
  ],
  next_cursor: 'c1',
  has_more: true,
  counts: { win: 1, loss: 0, long: 1, short: 0, total: 1 },
  data_status: 'ready',
  as_of: '2026-10-08T00:00:00Z',
  partial: false,
};

const mockActivityPage2 = {
  rows: [
    {
      market: 'ETH',
      side: 'SHORT',
      opened_at: '2026-10-05T08:00:00Z',
      closed_at: '2026-10-05T08:30:00Z',
      duration_sec: 21600,
      volume: 10000,
      entry_price: 3000,
      exit_price: 3100,
      pnl: -200,
      fees: 10,
      funding: 0,
      net_pnl: -210,
      fills: 2,
    },
  ],
  next_cursor: null,
  has_more: false,
  counts: { win: 1, loss: 0, long: 1, short: 0, total: 1 },
  data_status: 'ready',
  as_of: '2026-10-08T00:00:00Z',
  partial: false,
};

async function seedAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'test-token');
    localStorage.setItem('refresh_token', 'test-refresh');
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
  overrides: {
    detail?: unknown;
    positions?: unknown;
    activityFirst?: unknown;
    activitySecond?: unknown;
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
      const cursor = url.searchParams.get('cursor');
      const data =
        cursor === 'c1'
          ? (overrides.activitySecond ?? mockActivityPage2)
          : (overrides.activityFirst ?? mockActivityPage1);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data }),
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

test.describe('Trader Detail positions + activity (live, contract v1.2)', () => {
  test('renders positions table and activity feed', async ({ page }) => {
    await seedAuth(page);
    await mockTraderEndpoints(page);
    await page.goto(`/en/traders/${WALLET}`);
    await expect(page.getByRole('heading', { name: 'Smart Money' })).toBeVisible();
    await expect(page.getByText('Open Positions')).toBeVisible();
    await expect(page.getByText('BTC').first()).toBeVisible();
    await expect(page.getByText('Recent Activity')).toBeVisible();
    await expect(page.getByText('Net PnL').first()).toBeVisible();
  });

  test('shows empty states when no positions and no activity', async ({ page }) => {
    await seedAuth(page);
    await mockTraderEndpoints(page, {
      positions: { summary: null, positions: [], data_status: 'ready', as_of: null },
      activityFirst: {
        rows: [],
        next_cursor: null,
        has_more: false,
        counts: { win: 0, loss: 0, long: 0, short: 0, total: 0 },
        data_status: 'ready',
        as_of: '2026-10-08T00:00:00Z',
        partial: false,
      },
    });
    await page.goto(`/en/traders/${WALLET}`);
    await expect(page.getByText('No open positions')).toBeVisible();
    await expect(page.getByText('No recent activity')).toBeVisible();
  });

  test('shows Ready (never syncing) for live positions', async ({ page }) => {
    await seedAuth(page);
    await mockTraderEndpoints(page, {
      positions: { summary: null, positions: [], data_status: 'ready', as_of: null },
      activityFirst: {
        rows: [],
        next_cursor: null,
        has_more: false,
        counts: { win: 0, loss: 0, long: 0, short: 0, total: 0 },
        data_status: 'ready',
        as_of: '2026-10-08T00:00:00Z',
        partial: false,
      },
    });
    await page.goto(`/en/traders/${WALLET}`);
    await expect(page.getByText('Ready').first()).toBeVisible();
    await expect(page.getByText('Syncing')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Sync now' })).toHaveCount(0);
  });

  test('loads the next activity page on Load more', async ({ page }) => {
    await seedAuth(page);
    await mockTraderEndpoints(page);
    await page.goto(`/en/traders/${WALLET}`);
    await expect(page.getByText('BTC').first()).toBeVisible();
    await page.getByRole('button', { name: 'Load more' }).click();
    await expect(page.getByText('ETH').first()).toBeVisible();
  });

  test('keeps overview visible when positions fail', async ({ page }) => {
    await seedAuth(page);
    await mockTraderEndpoints(page, { positionsStatus: 500 });
    await page.goto(`/en/traders/${WALLET}`);
    await expect(page.getByRole('heading', { name: 'Smart Money' })).toBeVisible();
    await expect(page.getByText('Open Positions')).toBeVisible();
  });
});
