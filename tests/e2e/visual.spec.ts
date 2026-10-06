import { test, expect, type Page } from '@playwright/test';

const TRADER = {
  wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
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
};

const SHOT = {
  animations: 'disabled' as const,
  caret: 'hide' as const,
  // Next dev renders a transient status pill ("Rendering...") via nextjs-portal;
  // hide it so baselines are deterministic. Applies to the screenshot only.
  style: 'nextjs-portal{display:none!important}',
  // 2% tolerance: the dev pill (~1%) can resurface between settle and capture
  // under parallel load. Real regressions exceed this; prod builds have no pill.
  maxDiffPixelRatio: 0.02,
};

async function settle(page: Page) {
  // Next dev shows a transient "Rendering..." status pill; wait it out.
  await expect(page.locator('body')).not.toContainText('Rendering...', { timeout: 10000 });
}

async function freezeClock(page: Page) {
  await page.clock.install({ time: new Date('2026-10-02T12:00:00Z') });
}

async function mockGroups(page: Page, groups: unknown[] = []) {
  await page.route('**/api/v1/trader-groups', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: groups }),
    }),
  );
}

async function applyFilters(page: Page) {
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
}

test.describe('Visual desktop', () => {
  test('scanner default', async ({ page }) => {
    await freezeClock(page);
    await mockGroups(page);
    await page.route('**/api/v1/traders/search', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [TRADER], meta: {} }),
      }),
    );
    await page.goto('/en/traders');
    await expect(page.getByRole('button', { name: 'Filters', exact: true })).toBeVisible();
    await expect(page.getByText('Smart Money')).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await settle(page);
    await expect(page.locator('main')).toHaveScreenshot('scanner-default.png', SHOT);
  });

  test('filter sheet open', async ({ page }) => {
    await freezeClock(page);
    await mockGroups(page);
    await page.route('**/api/v1/traders/search', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [TRADER], meta: {} }),
      }),
    );
    await page.goto('/en/traders');
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    // The sheet is portaled to <body>, so capture the page rather than `main`.
    // Asserting the Apply button settles the 180ms open transition.
    await expect(page.locator('[data-slot="sheet-content"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Apply', exact: true })).toBeVisible();
    await expect(page.getByText('Smart Money')).toBeVisible();
    await settle(page);
    await expect(page).toHaveScreenshot('scanner-sheet-open.png', SHOT);
  });

  test('scanner results', async ({ page }) => {
    await freezeClock(page);
    await mockGroups(page);
    await page.route('**/api/v1/traders/search', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [TRADER], meta: {} }),
      }),
    );
    await page.goto('/en/traders');
    await applyFilters(page);
    await expect(page.getByText('Smart Money')).toBeVisible();
    await settle(page);
    await expect(page.locator('main')).toHaveScreenshot('scanner-results.png', SHOT);
  });

  test('scanner empty', async ({ page }) => {
    await freezeClock(page);
    await mockGroups(page);
    await page.route('**/api/v1/traders/search', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [], meta: {} }),
      }),
    );
    await page.goto('/en/traders');
    await applyFilters(page);
    await expect(page.getByText('No traders found')).toBeVisible();
    await settle(page);
    await expect(page.locator('main')).toHaveScreenshot('scanner-empty.png', SHOT);
  });

  test('scanner error', async ({ page }) => {
    await freezeClock(page);
    await mockGroups(page);
    await page.route('**/api/v1/traders/search', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: { code: 'INTERNAL', message: 'boom' } }),
      }),
    );
    await page.goto('/en/traders');
    await applyFilters(page);
    await expect(page.getByText('An error occurred, please try again')).toBeVisible();
    await settle(page);
    await expect(page.locator('main')).toHaveScreenshot('scanner-error.png', SHOT);
  });

  test('trader detail', async ({ page }) => {
    await freezeClock(page);
    await page.route('**/api/v1/traders/0x*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            registry: {
              wallet_address: TRADER.wallet_address,
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
            metrics: TRADER,
            period: '30D',
          },
        }),
      }),
    );
    await page.goto(`/en/traders/${TRADER.wallet_address}`);
    await expect(page.getByRole('heading', { name: 'Smart Money' })).toBeVisible();
    await settle(page);
    await expect(page.locator('main')).toHaveScreenshot('trader-detail.png', SHOT);
  });

  test('groups list', async ({ page }) => {
    await freezeClock(page);
    await mockGroups(page, [
      { id: 'g1', user_id: 'u1', name: 'Main', description: 'Primary watchlist', member_count: 12 },
    ]);
    await page.goto('/en/groups');
    await expect(page.getByText('Main')).toBeVisible();
    await settle(page);
    await expect(page.locator('main')).toHaveScreenshot('groups-list.png', SHOT);
  });
});

test.describe('Visual narrow', () => {
  test.use({ viewport: { width: 640, height: 900 } });

  test('scanner results narrow', async ({ page }) => {
    await freezeClock(page);
    await mockGroups(page);
    await page.route('**/api/v1/traders/search', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [TRADER], meta: {} }),
      }),
    );
    await page.goto('/en/traders');
    await applyFilters(page);
    await expect(page.getByText('Smart Money')).toBeVisible();
    await page.locator('main').evaluate((el) => {
      el.scrollTo(0, 0);
      el.querySelectorAll('[data-slot="table-container"]').forEach((t) => t.scrollTo(0, 0));
    });
    await settle(page);
    await expect(page.locator('main')).toHaveScreenshot('scanner-results-narrow.png', SHOT);
  });

  test('trader detail narrow', async ({ page }) => {
    await freezeClock(page);
    await page.route('**/api/v1/traders/0x*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            registry: {
              wallet_address: TRADER.wallet_address,
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
            metrics: TRADER,
            period: '30D',
          },
        }),
      }),
    );
    await page.goto(`/en/traders/${TRADER.wallet_address}`);
    await expect(page.getByRole('heading', { name: 'Smart Money' })).toBeVisible();
    await settle(page);
    await expect(page.locator('main')).toHaveScreenshot('trader-detail-narrow.png', SHOT);
  });
});
