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

const mockOverview = {
  as_of: '2026-01-01T00:00:00Z',
  venue: 'hyperliquid',
  period: '30D',
  pnl_metric: 'realized_pnl',
  universe_size: 10,
  pnl_buckets: [
    {
      id: 'profitable',
      min_pnl: 0,
      max_pnl: 100000,
      wallet_count: 5,
      pnl_total: 1000,
      volume_total: 5000,
      long_count: 3,
      short_count: 2,
      long_ratio: 0.6,
      long_notional: 3000,
      short_notional: 2000,
      sentiment: 'bullish',
      series: [{ t: '2026-01-01', v: 1 }],
    },
  ],
  account_buckets: [
    {
      id: 'medium',
      min_equity: 10000,
      max_equity: 100000,
      wallet_count: 4,
      equity_total: 50000,
      long_count: 2,
      short_count: 2,
      series: [{ t: '2026-01-01', v: 50000 }],
    },
  ],
  coverage: {
    pnl_wallets: 10,
    account_value_wallets: 8,
    series_wallets: 6,
    data_status: { ready: 9, stale: 1, error: 0, syncing: 0 },
  },
};

test.describe('Trader Overview', () => {
  test('renders page, header, sections and cards', async ({ page }) => {
    await seedAuth(page);
    await page.route('**/api/v1/traders/overview**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockOverview }),
      }),
    );
    await page.goto('/en/traders/overview');
    await expect(page.getByText('Trader Overview')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Performance' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Account Size' })).toBeVisible();
    await expect(page.getByTestId('sentiment-badge').first()).toBeVisible();
  });

  test('navigates to scanner via sidebar', async ({ page }) => {
    await seedAuth(page);
    await page.route('**/api/v1/traders/overview**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockOverview }),
      }),
    );
    await page.route('**/api/v1/traders/search', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [], meta: {} }),
      }),
    );
    await page.goto('/en/traders/overview');
    await page.getByRole('link', { name: 'Trader Scanner' }).click();
    await expect(page).toHaveURL(/\/traders$/);
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await seedAuth(page);
    await page.route('**/api/v1/traders/overview**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockOverview }),
      }),
    );
    await page.goto('/en/traders/overview');
    await expect(page.getByText('Trader Overview')).toBeVisible();
    expect(errors.filter((e) => !e.includes('favicon'))).toEqual([]);
  });
});
