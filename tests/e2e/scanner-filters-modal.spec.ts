import { test, expect } from '@playwright/test';

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

test('filters open as a modal above the table, not beside it', async ({ page }) => {
  await page.route('**/api/v1/traders/search', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [TRADER], meta: {} }),
    }),
  );
  await page.route('**/api/v1/trader-groups**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    }),
  );

  await page.goto('/en/traders');
  await expect(page.getByText('Smart Money')).toBeVisible();

  const table = page.locator('[data-slot="table"]').first();
  const before = await table.boundingBox();

  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(dialog.getByRole('heading', { name: 'Filter traders' })).toBeVisible();

  expect(await dialog.evaluate((el) => !!el.closest('[data-slot="table-container"]'))).toBe(false);

  const whileOpen = await table.boundingBox();
  expect(whileOpen?.width).toBe(before?.width);

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);

  const afterClose = await table.boundingBox();
  expect(afterClose?.width).toBe(before?.width);
});
