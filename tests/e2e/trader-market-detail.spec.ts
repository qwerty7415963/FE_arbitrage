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

const mockHeader = {
  venue: 'hyperliquid',
  market: 'BTC',
  mark_price: 100,
  index_price: 99,
  funding_rate: 0.0001,
  next_funding_at: '2026-01-08T00:00:00Z',
  market_oi: 1000,
  logo_url: null,
  category: 'crypto',
  enabled: true,
  as_of: '2026-01-08T00:00:00Z',
};

const mockSnapshot = {
  open_notional_long: 500,
  open_notional_short: 200,
  long_short_ratio: 2.5,
  unrealized_pnl_long: 10,
  unrealized_pnl_short: -5,
  net_unrealized_pnl: 5,
  traders_long: 3,
  traders_short: 2,
  traders_total: 5,
  margin_used_long: 100,
  margin_used_short: 50,
  margin_used_total: 150,
  avg_leverage_long: 2,
  avg_leverage_short: 1.5,
  market_oi: 1000,
  synced_at: '2026-01-08T00:00:00Z',
};

const mockWallets = [
  {
    address: '0x1111111111111111111111111111111111111111',
    display_name: 'Trader One',
    cohort: 'medium',
    bias: 'bullish',
    volume: 1000,
    trades: 10,
    win_rate: 60,
    realized_pnl: 100,
    long_count: 6,
    short_count: 4,
    last_trade_at: '2026-01-08T00:00:00Z',
    position_side: 'LONG',
    position_notional: 500,
    position_upnl: 50,
    position_leverage: 2,
    margin_used: 100,
  },
];

async function mockMarketDetail(page: Page) {
  await page.route(/\/api\/v1\/traders\/markets\/BTC(\?|$)/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          header: mockHeader,
          snapshot: mockSnapshot,
          coverage: { tracked_wallets_with_positions: 5, total_wallets_in_market: 10 },
        },
      }),
    }),
  );
  await page.route(/\/api\/v1\/traders\/markets\/BTC\/wallets/, (route) =>
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
}

test.describe('Trader Market Detail', () => {
  test('loads and renders wallet table', async ({ page }) => {
    await seedAuth(page);
    await mockMarketDetail(page);
    await page.goto('/en/traders/markets/BTC?venue=hyperliquid');

    await expect(page.getByTestId('market-header')).toBeVisible();
    await expect(page.getByTestId('market-snapshot-ribbon')).toBeVisible();
    await expect(page.getByTestId('market-wallet-table')).toBeVisible();
    await expect(page.getByText('Trader One')).toBeVisible();
  });
});
