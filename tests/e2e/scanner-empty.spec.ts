import { test, expect, type Page } from '@playwright/test';

async function applyFilters(page: Page, roiMin: string) {
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByLabel('ROI from (%)').fill(roiMin);
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
}

test.describe('Scanner empty results', () => {
  test('impossible filter shows no traders found without error alert', async ({ page }) => {
    await page.route('**/api/v1/traders/search', (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      if (body.roi_min === 999999) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            meta: { page: 1, total: 0, total_pages: 1 },
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              wallet_address: '0x' + '1'.repeat(40),
              venue: 'hyperliquid',
              venue_id: null,
              period: '30D',
              display_name: 'Trader 1',
              pnl: 100,
              realized_pnl: 100,
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
            },
          ],
          meta: { page: 1, total: 1, total_pages: 1 },
        }),
      });
    });
    await page.goto('/en/traders');
    await expect(page.getByText('Trader 1')).toBeVisible();
    await applyFilters(page, '999999');
    await expect(page.getByText('No traders found')).toBeVisible();
    await expect(page.getByText('An error occurred, please try again')).toHaveCount(0);
  });
});
