import { test, expect, type Page } from '@playwright/test';

function makeTrader(i: number) {
  const hex = i.toString(16).padStart(40, '0');
  return {
    wallet_address: `0x${hex}`,
    venue: 'hyperliquid',
    venue_id: null,
    period: '30D',
    display_name: i % 10 === 0 ? null : `Trader ${i}`,
    pnl: i * 100 - 5000,
    realized_pnl: i * 100 - 5000,
    roi: (i % 40) - 10,
    win_rate: i % 101,
    volume: i * 1000,
    trade_count: i,
    profit_factor: i % 7 === 0 ? null : 1.5,
    max_drawdown_pct: null,
    long_count: i,
    long_wins: Math.floor(i / 2),
    short_count: i,
    short_wins: Math.floor(i / 3),
    gross_profit: null,
    gross_loss: null,
    avg_trade_pnl: null,
    avg_holding_time_sec: null,
    last_trade_at: '2024-01-02T00:00:00Z',
    data_status: i % 20 === 0 ? 'stale' : 'ready',
    is_partial: false,
    metrics_as_of: '2024-01-02T01:00:00Z',
    calculation_version: 1,
  };
}

async function mockGroups(page: Page) {
  await page.route('**/api/v1/trader-groups', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    }),
  );
}

test.describe('Performance smoke', () => {
  test('renders 100 rows without blocking', async ({ page }) => {
    const rows = Array.from({ length: 100 }, (_, i) => makeTrader(i));
    await mockGroups(page);
    await page.route('**/api/v1/traders/search', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: rows, meta: { has_more: false } }),
      }),
    );
    await page.goto('/en/wallets');
    const started = Date.now();
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('100 results')).toBeVisible({ timeout: 15000 });
    const elapsed = Date.now() - started;
    expect(elapsed).toBeLessThan(15000);
    await expect(page.locator('tbody tr')).toHaveCount(100);
  });

  test('slow search keeps old rows visible with progress', async ({ page }) => {
    const rows = [makeTrader(1)];
    await mockGroups(page);
    let calls = 0;
    await page.route('**/api/v1/traders/search', (route) => {
      calls += 1;
      if (calls === 1) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: rows, meta: {} }),
        });
      }
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          void route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: [makeTrader(2)], meta: {} }),
          });
          resolve();
        }, 800);
      });
    });
    await page.goto('/en/wallets');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('Trader 1')).toBeVisible();
    await page.getByLabel('ROI Min').fill('10');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('Updating...')).toBeVisible();
    await expect(page.getByText('Trader 1')).toBeVisible();
    await expect(page.getByText('Trader 2')).toBeVisible();
  });

  test('large group stays usable with client paging', async ({ page }) => {
    const members = Array.from({ length: 500 }, (_, i) => ({
      group_id: 'g1',
      venue_id: null,
      venue: 'hyperliquid',
      wallet_address: `0x${i.toString(16).padStart(40, '0')}`,
      display_name: null,
      alias: null,
      note: null,
    }));
    await page.route('**/api/v1/trader-groups/g1', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 'g1', user_id: 'u1', name: 'Big', description: null, member_count: 500 },
        }),
      }),
    );
    await page.route('**/api/v1/trader-groups/g1/members*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: members }),
      }),
    );
    await page.goto('/en/groups/g1');
    const started = Date.now();
    await expect(page.getByRole('heading', { name: 'Big' })).toBeVisible({ timeout: 15000 });
    expect(Date.now() - started).toBeLessThan(15000);
    await expect(page.locator('tbody tr')).toHaveCount(10);
  });
});
