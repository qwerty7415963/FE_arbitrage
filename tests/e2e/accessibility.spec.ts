import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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

async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
}

async function mockScanner(page: Page) {
  await page.route('**/api/v1/traders/search', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [TRADER], meta: {} }),
    }),
  );
  await page.route('**/api/v1/trader-groups', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    }),
  );
}

test.describe('Accessibility', () => {
  test('scanner default has no violations', async ({ page }) => {
    await mockScanner(page);
    await page.goto('/en/wallets');
    await expectNoViolations(page);
  });

  test('scanner with results has no violations', async ({ page }) => {
    await mockScanner(page);
    await page.goto('/en/wallets');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('Smart Money')).toBeVisible();
    await expectNoViolations(page);
  });

  test('scanner error state has no violations', async ({ page }) => {
    await mockScanner(page);
    await page.route('**/api/v1/traders/search', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: { code: 'INTERNAL', message: 'boom' } }),
      }),
    );
    await page.goto('/en/wallets');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('An error occurred, please try again')).toBeVisible();
    await expectNoViolations(page);
  });

  test('trader detail has no violations', async ({ page }) => {
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
    await page.goto(`/en/wallets/${TRADER.wallet_address}`);
    await expect(page.getByRole('heading', { name: 'Smart Money' })).toBeVisible();
    await expectNoViolations(page);
  });

  test('groups list and create dialog have no violations', async ({ page }) => {
    await page.route('**/api/v1/trader-groups', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'g1', user_id: 'u1', name: 'Main', description: null, member_count: 2 }],
        }),
      }),
    );
    await page.goto('/en/groups');
    await expect(page.getByText('Main')).toBeVisible();
    await expectNoViolations(page);
    await page.getByRole('button', { name: 'Create' }).first().click();
    await expect(page.getByText('Create group')).toBeVisible();
    await expectNoViolations(page);
  });

  test('add-to-group modal has no violations', async ({ page }) => {
    await mockScanner(page);
    await page.route('**/api/v1/trader-groups', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'g1', user_id: 'u1', name: 'Main', description: null, member_count: 0 }],
        }),
      }),
    );
    await page.goto('/en/wallets');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('Smart Money')).toBeVisible();
    await page.getByLabel(`Select ${TRADER.wallet_address}`).click();
    await page.getByRole('button', { name: 'Add to group (1)', exact: true }).click();
    await expect(page.getByText('Add wallets to group')).toBeVisible();
    await expectNoViolations(page);
  });
});
