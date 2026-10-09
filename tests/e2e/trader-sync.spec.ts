import { test, expect, type Page } from '@playwright/test';

// Contract v1.1 §4 F4 + §5 fixtures (orchestrator-owned). No invented fields.
const WALLET = '0x2222222222222222222222222222222222222222';

const mockDetail = {
  registry: {
    wallet_address: WALLET,
    venue: 'hyperliquid',
    venue_id: null,
    display_name: 'Sync Wallet',
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
    display_name: 'Sync Wallet',
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

// §5 activity syncing variant (data).
const syncingActivity = {
  rows: [],
  next_cursor: null,
  has_more: false,
  counts: { win: 0, loss: 0, long: 0, short: 0, total: 0 },
  data_status: 'syncing',
};

const readyActivity = {
  rows: [
    {
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
      net_pnl: 1470.0,
      fills: 3,
    },
  ],
  next_cursor: null,
  has_more: false,
  counts: { win: 1, loss: 0, long: 1, short: 0, total: 1 },
  data_status: 'ready',
};

const readyEmptyActivity = {
  rows: [],
  next_cursor: null,
  has_more: false,
  counts: { win: 0, loss: 0, long: 0, short: 0, total: 0 },
  data_status: 'ready',
};

const syncingPositions = { summary: null, positions: [], data_status: 'syncing', as_of: null };

const readyPositions = {
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

const readyEmptyPositions = {
  summary: null,
  positions: [],
  data_status: 'ready',
  as_of: null,
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

type SyncMode = 'unsynced-to-ready' | 'ready-empty';

interface SyncWindow {
  positions: number;
  activity: number;
}

async function mockSyncFlow(
  page: Page,
  mode: SyncMode,
  window: SyncWindow = { positions: 1, activity: 2 },
) {
  let positionsCalls = 0;
  let activityCalls = 0;
  const syncPosts: string[] = [];
  await page.route('**/api/v1/traders/**', (route) => {
    const url = new URL(route.request().url());
    const ok = (data: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data }),
      });
    // §5 POST /sync 202 {"status": "queued"} (the data envelope).
    if (route.request().method() === 'POST' && url.pathname.endsWith('/sync')) {
      syncPosts.push(url.pathname);
      return ok({ status: 'queued' }, 202);
    }
    if (url.pathname.endsWith('/positions')) {
      positionsCalls += 1;
      if (mode === 'ready-empty') return ok(readyEmptyPositions);
      return ok(positionsCalls <= window.positions ? syncingPositions : readyPositions);
    }
    if (url.pathname.endsWith('/activity')) {
      activityCalls += 1;
      if (mode === 'ready-empty') return ok(readyEmptyActivity);
      return ok(activityCalls <= window.activity ? syncingActivity : readyActivity);
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
  return { syncPosts };
}

test.describe('Trader sync-on-view (contract v1.1 §4)', () => {
  test('S1 seed unsynced => POST /sync once, syncing skeleton, then data without refresh', async ({
    page,
  }) => {
    test.setTimeout(60000);
    await seedAuth(page);
    const { syncPosts } = await mockSyncFlow(page, 'unsynced-to-ready', {
      positions: 1,
      activity: 1,
    });
    await page.goto(`/en/traders/${WALLET}`);
    await expect(page.getByRole('heading', { name: 'Sync Wallet' })).toBeVisible();

    // F1: exactly one auto-trigger on mount (polled: the POST may fire
    // before the heading assertion settles on instant mocks).
    await expect.poll(() => syncPosts.length, { timeout: 15000 }).toBe(1);

    // F3: syncing + empty => syncing skeleton, never a definitive empty.
    await expect(page.getByRole('status', { name: 'Syncing activity...' })).toBeVisible();
    await expect(page.getByText('No recent activity')).toHaveCount(0);

    // F2: polling resolves the first view WITHOUT manual refresh.
    await expect(page.getByText('BTC').first()).toBeVisible({ timeout: 25000 });
    await expect(page.getByText('Net PnL').first()).toBeVisible({ timeout: 25000 });
    expect(syncPosts).toHaveLength(1);
  });

  test('S2 trades tab shows the syncing skeleton while unsynced, then rows', async ({ page }) => {
    test.setTimeout(60000);
    await seedAuth(page);
    const { syncPosts } = await mockSyncFlow(page, 'unsynced-to-ready', {
      positions: 1,
      activity: 2,
    });
    await page.goto(`/en/traders/${WALLET}?tab=trades`);
    const panel = page.locator('#wallet-panel-trades');
    await expect(panel.getByRole('status', { name: 'Syncing trades...' })).toBeVisible();
    await expect(panel.getByText('No closed trades')).toHaveCount(0);
    await expect(panel.getByText('BTC').first()).toBeVisible({ timeout: 25000 });
    expect(syncPosts).toHaveLength(1);
  });

  test('S3 genuine empty only when ready + empty, Sync now posts + refetches', async ({ page }) => {
    await seedAuth(page);
    const { syncPosts } = await mockSyncFlow(page, 'ready-empty');
    await page.goto(`/en/traders/${WALLET}?tab=trades`);
    const panel = page.locator('#wallet-panel-trades');
    await expect(panel.getByText('No closed trades')).toBeVisible();
    await expect(panel.getByRole('status', { name: 'Syncing trades...' })).toHaveCount(0);
    await expect(page.getByText('No recent activity')).toBeVisible();
    await expect(page.getByRole('status', { name: 'Syncing activity...' })).toHaveCount(0);
    // Empty trades still auto-trigger once (F1: trades empty).
    expect(syncPosts).toHaveLength(1);

    // F3 fallback: Sync now POSTs again and refetches.
    const secondPost = page.waitForRequest(
      (r) =>
        r.method() === 'POST' &&
        r.url().includes('/traders/') &&
        r.url().endsWith('/sync?venue=hyperliquid'),
    );
    await panel.getByRole('button', { name: 'Sync now' }).click();
    await secondPost;
    expect(syncPosts).toHaveLength(2);
  });

  test('S4 vietnamese locale renders the translated sync states', async ({ page }) => {
    await seedAuth(page);
    await mockSyncFlow(
      page,
      'unsynced-to-ready',
      // Wide window: two full page loads stay syncing, no waiting for ready.
      { positions: 5, activity: 5 },
    );
    await page.goto(`/vi/traders/${WALLET}`);
    await expect(page.getByRole('status', { name: 'Đang đồng bộ hoạt động...' })).toBeVisible();
    await page.goto(`/vi/traders/${WALLET}?tab=trades`);
    await expect(
      page
        .locator('#wallet-panel-trades')
        .getByRole('status', { name: 'Đang đồng bộ giao dịch...' }),
    ).toBeVisible();
    await expect(
      page.locator('#wallet-panel-trades').getByRole('button', { name: 'Đồng bộ ngay' }),
    ).toBeVisible();
  });
});
