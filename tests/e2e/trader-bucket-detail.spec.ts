import { test, expect, type Page } from '@playwright/test';

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

const positioning = Array.from({ length: 10 }, (_, index) => ({
  t: `2025-10-${String(13 + index).padStart(2, '0')}`,
  long_pct: 0.4 + index * 0.02,
}));

const mockDetail = {
  as_of: '2026-01-01T00:00:00Z',
  kind: 'pnl',
  bucket_id: 'profitable',
  wallet_count: 2,
  sentiment: 'bullish',
  long_ratio: 0.6,
  pnl_split: { pct_profit: 0.6, pct_loss: 0.4, usd_profit: 100, usd_loss: -40 },
  notional_split: { long_usd: 300, short_usd: 200 },
  positioning,
  markets_top: [
    { market: 'BTC', notional: 100, upnl: 10, sentiment: 'bullish', traders: 2 },
    { market: 'ETH', notional: 60, upnl: -5, sentiment: 'bearish', traders: 2 },
    { market: 'SOL', notional: 25, upnl: 0, sentiment: 'neutral', traders: 1 },
  ],
  coverage: { wallets_with_positions: 1, wallets_with_trades: 2 },
  markets_source: 'positions',
};

const mockWallets = [
  {
    address: '0x1111111111111111111111111111111111111111',
    display_name: 'Trader One',
    perp_equity: 1000,
    position_value: 500,
    leverage: 2,
    win_rate: 0.6,
    volume_range: 10000,
    realized_pnl: 100,
    sum_upnl: 50,
    bias: 'bullish',
    cohort: 'medium',
  },
];

const mockMarkets = [
  {
    market: 'BTC',
    sentiment: 'bullish',
    notional_long: 100,
    notional_short: 50,
    traders_long: 1,
    traders_short: 1,
    pnl_profit: 10,
    pnl_loss: -2,
  },
];

async function mockBucketDetail(page: Page) {
  await page.route(/\/api\/v1\/traders\/overview\/buckets\/pnl\/profitable(\?|$)/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: mockDetail }),
    }),
  );
  await page.route(/\/api\/v1\/traders\/overview\/buckets\/pnl\/profitable\/wallets/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: mockWallets,
        meta: { page: 1, total: 1, total_pages: 1, limit: 20, has_more: false },
      }),
    }),
  );
  await page.route(/\/api\/v1\/traders\/overview\/buckets\/pnl\/profitable\/markets/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: mockMarkets,
        meta: { page: 1, total: 1, total_pages: 1, limit: 20, has_more: false },
      }),
    }),
  );
}

test.describe('Trader Bucket Detail', () => {
  test('renders header, bars, chart, tooltip and tabs', async ({ page }) => {
    await seedAuth(page);
    await mockBucketDetail(page);
    await page.goto('/en/traders/overview/pnl/profitable');

    await expect(page.getByTestId('bucket-header')).toBeVisible();
    await expect(page.getByTestId('bucket-stat-bars')).toBeVisible();
    await expect(page.getByTestId('bucket-positioning-chart')).toBeVisible();
    await expect(page.getByTestId('bucket-treemap')).toBeVisible();
    await expect(page.getByTestId('bucket-tables')).toBeVisible();

    const chart = page.getByTestId('bucket-positioning-chart');
    await expect(chart.getByText('Profitable Positioning')).toBeVisible();
    await expect(chart.locator('svg')).toBeVisible();
    await expect(page.getByTestId('chart-range-caption')).toHaveText('30D · BULLISH');
    await expect(page.getByTestId('chart-long-caption')).toHaveText('58.0% Long');
  });

  test('chart range tabs change the caption', async ({ page }) => {
    await seedAuth(page);
    await mockBucketDetail(page);
    await page.goto('/en/traders/overview/pnl/profitable');

    const chart = page.getByTestId('bucket-positioning-chart');
    await chart.getByRole('button', { name: '7D' }).click();
    await expect(page.getByTestId('chart-range-caption')).toHaveText('7D · BULLISH');
    await chart.getByRole('button', { name: '24H' }).click();
    await expect(page.getByTestId('chart-range-caption')).toHaveText('24H · BULLISH');
  });

  test('page and chart range selectors are independent', async ({ page }) => {
    await seedAuth(page);
    await mockBucketDetail(page);
    await page.goto('/en/traders/overview/pnl/profitable');

    const header = page.getByTestId('bucket-header');
    const chart = page.getByTestId('bucket-positioning-chart');

    await expect(header.getByRole('button', { name: '30D' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByTestId('chart-range-caption')).toHaveText('30D · BULLISH');

    // changing chart range updates only chart, page range unchanged
    await chart.getByRole('button', { name: '7D' }).click();
    await expect(page.getByTestId('chart-range-caption')).toHaveText('7D · BULLISH');
    await expect(header.getByRole('button', { name: '30D' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    // changing page range updates only page, chart slice unchanged
    await header.getByRole('button', { name: '7D' }).click();
    await expect(header.getByRole('button', { name: '7D' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByTestId('chart-range-caption')).toHaveText('7D · BULLISH');
  });

  test('renders treemap tiles for top markets', async ({ page }) => {
    await seedAuth(page);
    await mockBucketDetail(page);
    await page.goto('/en/traders/overview/pnl/profitable');

    await expect(page.getByTestId('treemap-tile')).toHaveCount(3);
    await expect(page.getByTestId('bucket-treemap').getByText('BTC')).toBeVisible();
    await expect(page.getByTestId('bucket-treemap').getByText('+$10.00')).toBeVisible();
    await expect(page.getByTestId('bucket-treemap').getByText('UPNL').first()).toBeVisible();
  });

  test('wallets sort and markets search', async ({ page }) => {
    await seedAuth(page);
    await mockBucketDetail(page);
    await page.goto('/en/traders/overview/pnl/profitable');
    await page.getByRole('tab', { name: /Markets/i }).click();
    await page.getByPlaceholder('Search markets').fill('BTC');
  });

  test('chart and treemap are side by side on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await seedAuth(page);
    await mockBucketDetail(page);
    await page.goto('/en/traders/overview/pnl/profitable');

    const chart = page.getByTestId('bucket-positioning-chart');
    const treemap = page.getByTestId('bucket-treemap');
    await expect(chart).toBeVisible();
    await expect(treemap).toBeVisible();

    const chartBox = await chart.boundingBox();
    const treemapBox = await treemap.boundingBox();
    if (!chartBox || !treemapBox) throw new Error('missing boxes');

    expect(Math.abs(chartBox.y - treemapBox.y)).toBeLessThan(8);
    expect(Math.abs(chartBox.width - treemapBox.width)).toBeLessThan(24);
  });

  test('chart and treemap stack on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await seedAuth(page);
    await mockBucketDetail(page);
    await page.goto('/en/traders/overview/pnl/profitable');

    const chart = page.getByTestId('bucket-positioning-chart');
    const treemap = page.getByTestId('bucket-treemap');
    const chartBox = await chart.boundingBox();
    const treemapBox = await treemap.boundingBox();
    if (!chartBox || !treemapBox) throw new Error('missing boxes');

    expect(treemapBox.y).toBeGreaterThan(chartBox.y + chartBox.height - 8);
  });

  test('wallets sort header toggles aria-sort and icon', async ({ page }) => {
    await seedAuth(page);
    await mockBucketDetail(page);
    await page.goto('/en/traders/overview/pnl/profitable');

    const equityHeader = page.getByRole('columnheader', { name: /^Equity$/i });
    const equityButton = page.getByRole('button', { name: 'Equity' });

    await expect(equityHeader).toHaveAttribute('aria-sort', 'descending');
    await expect(equityButton.locator('svg')).toHaveClass(/lucide-arrow-down/);

    await equityButton.click();
    await expect(equityHeader).toHaveAttribute('aria-sort', 'ascending');
    await expect(equityButton.locator('svg')).toHaveClass(/lucide-arrow-up/);

    // other sortable columns show the neutral indicator
    await expect(page.getByRole('button', { name: 'Win Rate' }).locator('svg')).toHaveClass(
      /lucide-arrow-up-down/,
    );
  });

  test('renders VI labels on /vi route', async ({ page }) => {
    await seedAuth(page);
    await mockBucketDetail(page);
    await page.goto('/vi/traders/overview/pnl/profitable');

    const chart = page.getByTestId('bucket-positioning-chart');
    await expect(chart.getByText('Định vị nhóm Lãi')).toBeVisible();
    await expect(page.getByTestId('bucket-stat-bars')).toContainText('PnL thực hiện');
    await expect(page.getByTestId('bucket-stat-bars')).toContainText('Tỷ trọng khối lượng (≈)');
    await expect(page.getByTestId('bucket-tables')).toContainText('Ví');
    await expect(page.getByTestId('bucket-tables')).toContainText('Thị trường');
    await expect(page.getByTestId('bucket-tables')).toContainText('Vốn');
    await expect(page.getByText('Profitable Positioning')).toHaveCount(0);
    await expect(page.getByText('VOLUME SPLIT (≈)')).toHaveCount(0);
  });

  test('clicking wallet row navigates to wallet detail and back', async ({ page }) => {
    await seedAuth(page);
    await mockBucketDetail(page);
    await page.route(
      /\/api\/v1\/traders\/0x1111111111111111111111111111111111111111(\?|$)/,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              registry: {
                wallet_address: '0x1111111111111111111111111111111111111111',
                venue: 'hyperliquid',
                venue_id: null,
                display_name: 'Trader One',
                discovery_source: 'leaderboard',
                first_seen_at: '2024-01-01T00:00:00Z',
                last_seen_at: '2024-01-02T00:00:00Z',
                last_trade_at: '2024-01-02T00:00:00Z',
                leaderboard_seen_at: null,
                status: 'active',
              },
              metrics: null,
              period: '30D',
            },
          }),
        }),
    );
    await page.route(
      /\/api\/v1\/traders\/0x1111111111111111111111111111111111111111\/positions/,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { summary: null, positions: [], data_status: 'ready', as_of: null },
          }),
        }),
    );
    await page.goto('/en/traders/overview/pnl/profitable');

    await page.getByRole('row', { name: /View wallet/i }).click();
    await expect(page).toHaveURL(/\/en\/traders\/0x1111111111111111111111111111111111111111/);
    await expect(page.getByRole('heading', { name: 'Trader One' })).toBeVisible();

    await page.getByRole('button', { name: /Back to scanner/i }).click();
    await expect(page).toHaveURL(/\/en\/traders\/overview\/pnl\/profitable/);
  });
});
