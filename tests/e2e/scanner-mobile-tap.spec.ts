import { test, expect, type Page } from '@playwright/test';

function makeTrader(i: number) {
  const hex = i.toString(16).padStart(40, '0');
  return {
    wallet_address: `0x${hex}`,
    venue: 'hyperliquid',
    venue_id: null,
    period: '30D',
    display_name: `Trader ${i}`,
    pnl: i * 100,
    realized_pnl: i * 100,
    roi: 10,
    win_rate: 60,
    volume: 5000,
    trade_count: 20,
    profit_factor: 1.5,
    max_drawdown_pct: null,
    long_count: 10,
    long_wins: 6,
    short_count: 10,
    short_wins: 6,
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
}

async function applyFilters(page: Page) {
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
}

test.describe('Scanner mobile row tap', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('tapping a scanner row navigates to trader detail', async ({ page }) => {
    await page.route('**/api/v1/traders/search', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [makeTrader(1)],
          meta: { page: 1, total: 1, total_pages: 1 },
        }),
      }),
    );

    await page.goto('/en/traders');
    await applyFilters(page);
    await expect(page.getByText('Trader 1')).toBeVisible();

    await page.getByText('Trader 1').first().tap();

    await expect(page).toHaveURL(/\/traders\/0x[0-9a-f]+/i);
  });
});
