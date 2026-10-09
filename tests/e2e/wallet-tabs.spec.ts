import { test, expect, type Page } from '@playwright/test';

// Contract v1 fixtures (WALLET-TABS-FIXTURES.md). No invented fields.
const WALLET = '0x1111111111111111111111111111111111111111';

const mockDetail = {
  registry: {
    wallet_address: WALLET,
    venue: 'hyperliquid',
    venue_id: null,
    display_name: 'Tab Wallet',
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
    display_name: 'Tab Wallet',
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

const mockPositions = {
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

const winTrade = {
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
  funding: -12.5,
  net_pnl: 1470.0,
  fills: 3,
};

const lossTrade = {
  market: 'ETH',
  side: 'SHORT',
  opened_at: '2026-10-02T00:00:00Z',
  closed_at: '2026-10-02T06:00:00Z',
  duration_sec: 21600,
  volume: 10000.0,
  entry_price: 3000.0,
  exit_price: 3100.0,
  pnl: -200.0,
  fees: 10.0,
  funding: 0,
  net_pnl: -210.0,
  fills: 2,
};

const fullCounts = { win: 1, loss: 1, long: 1, short: 1, total: 2 };

const mockBalances = {
  perp: {
    account_value: 12345.67,
    total_ntl_pos: 5000.0,
    total_margin_used: 800.0,
    withdrawable: 11000.0,
    cross_account_value: 12345.67,
    cross_total_ntl_pos: 5000.0,
    cross_total_margin_used: 800.0,
    asset_positions_value: 5000.0,
    as_of: '2026-10-08T00:00:00Z',
  },
  spot: {
    balances: [
      { coin: 'USDC', token: '0', total: 100.0, hold: 0.0, entry_ntl: 0.0 },
      { coin: 'HYPE', token: '150', total: 5.0, hold: 0.0, entry_ntl: 120.0 },
    ],
    as_of: '2026-10-08T00:00:00Z',
  },
  data_status: 'ready',
};

const mockFills = {
  rows: [
    {
      coin: 'ETH',
      side: 'SELL',
      dir: 'Close Long',
      size: 8.97,
      price: 2309.1,
      closed_pnl: 19.19,
      fee: -0.62,
      fee_token: 'USDC',
      time: '2026-10-08T00:00:00Z',
      tid: 1101266132350103,
      oid: 391239781497,
      crossed: false,
      start_position: '8.97',
    },
  ],
  next_cursor: null,
  has_more: false,
};

const mockOpenOrders = {
  status: 'open',
  rows: [
    {
      coin: 'BTC',
      side: 'BUY',
      limit_px: 29792.0,
      size: 5.0,
      orig_size: 5.0,
      oid: 91490942,
      timestamp: '2026-10-08T00:00:00Z',
      reduce_only: false,
      order_type: 'Limit',
      trigger_condition: 'N/A',
      trigger_px: 0.0,
      is_position_tpsl: false,
      order_status: null,
      status_timestamp: null,
    },
  ],
};

const mockHistoricalOrders = {
  status: 'historical',
  rows: [
    {
      coin: 'BTC',
      side: 'BUY',
      limit_px: 29792.0,
      size: 5.0,
      orig_size: 5.0,
      oid: 91490942,
      timestamp: '2026-10-08T00:00:00Z',
      reduce_only: false,
      order_type: 'Limit',
      trigger_condition: 'N/A',
      trigger_px: 0.0,
      is_position_tpsl: false,
      order_status: 'filled',
      status_timestamp: '2026-10-08T01:00:00Z',
    },
  ],
};

const mockTransfers = {
  rows: [
    {
      time: '2026-10-08T00:00:00Z',
      hash: '0xabc',
      type: 'subAccountTransfer',
      usdc: 50000.0,
      token: null,
      amount: null,
      usdc_value: null,
      is_deposit: null,
      source_dex: null,
      destination_dex: null,
      counterparty: '0x2222222222222222222222222222222222222222',
    },
  ],
  next_cursor: null,
  has_more: false,
};

const mockPerformance = {
  period: '30D',
  metrics: {
    roi: 0.2,
    pnl: 1000.0,
    win_rate: 0.66,
    volume: 100000.0,
    trade_count: 30,
    profit_factor: 2.1,
    max_drawdown_pct: 12.5,
    long_wins: 24,
    long_count: 30,
    short_wins: 10,
    short_count: 20,
    data_status: 'ready',
    is_partial: false,
    metrics_as_of: '2026-10-08T00:00:00Z',
  },
  equity: [{ date: '2026-10-01', end_equity: 10000.0, daily_return: 0.01 }],
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

interface MockOverrides {
  positions?: unknown;
  activityRows?: unknown[];
  activityCounts?: unknown;
  balances?: unknown;
  balancesStatus?: number;
  failBalancesTimes?: number;
}

async function mockWalletTabs(page: Page, overrides: MockOverrides = {}) {
  let balancesCalls = 0;
  await page.route('**/api/v1/traders/**', (route) => {
    const url = new URL(route.request().url());
    const ok = (data: unknown) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data }),
      });
    if (url.pathname.endsWith('/positions')) return ok(overrides.positions ?? mockPositions);
    if (url.pathname.endsWith('/activity')) {
      let rows = overrides.activityRows ?? [winTrade, lossTrade];
      const result = url.searchParams.get('result');
      const side = url.searchParams.get('side');
      if (result === 'win') rows = rows.filter((r) => (r as { net_pnl: number }).net_pnl > 0);
      if (result === 'loss') rows = rows.filter((r) => (r as { net_pnl: number }).net_pnl < 0);
      if (side === 'long') rows = rows.filter((r) => (r as { side: string }).side === 'LONG');
      if (side === 'short') rows = rows.filter((r) => (r as { side: string }).side === 'SHORT');
      return ok({
        rows,
        next_cursor: null,
        has_more: false,
        counts: overrides.activityCounts ?? fullCounts,
        data_status: 'ready',
        as_of: '2026-10-08T00:00:00Z',
        partial: false,
      });
    }
    if (url.pathname.endsWith('/balances')) {
      balancesCalls += 1;
      if (overrides.balancesStatus) {
        return route.fulfill({
          status: overrides.balancesStatus,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: { code: 'INTERNAL', message: 'boom' } }),
        });
      }
      if (overrides.failBalancesTimes && balancesCalls <= overrides.failBalancesTimes) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: { code: 'INTERNAL', message: 'boom' } }),
        });
      }
      return ok(overrides.balances ?? mockBalances);
    }
    if (url.pathname.endsWith('/fills')) return ok(mockFills);
    if (url.pathname.endsWith('/orders')) {
      const status = url.searchParams.get('status');
      return ok(status === 'historical' ? mockHistoricalOrders : mockOpenOrders);
    }
    if (url.pathname.endsWith('/transfers')) return ok(mockTransfers);
    if (url.pathname.endsWith('/performance')) {
      const period = url.searchParams.get('period') ?? '30D';
      return ok({ ...mockPerformance, period });
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
}

test.describe('Wallet tabs (contract v1)', () => {
  test('E61 renders nine tabs with positions active by default', async ({ page }) => {
    await seedAuth(page);
    await mockWalletTabs(page);
    await page.goto(`/en/traders/${WALLET}`);
    await expect(page.getByRole('heading', { name: 'Tab Wallet' })).toBeVisible();
    for (const label of [
      'Positions',
      'Balances',
      'Predictions',
      'Orders',
      'Fills',
      'Trades',
      'Swap',
      'Transfers',
      'Performance',
    ]) {
      await expect(page.getByRole('tab', { name: label })).toBeVisible();
    }
    await expect(page.getByRole('tab', { name: 'Positions' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByText('BTC').first()).toBeVisible();
  });

  test('E62 deep-links ?tab=balances to the balances panel', async ({ page }) => {
    await seedAuth(page);
    await mockWalletTabs(page);
    await page.goto(`/en/traders/${WALLET}?tab=balances`);
    await expect(page.getByRole('tab', { name: 'Balances' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByText('Perp account')).toBeVisible();
    await expect(page.getByText('HYPE')).toBeVisible();
  });

  test('E63 clicking a tab writes ?tab= to the URL', async ({ page }) => {
    await seedAuth(page);
    await mockWalletTabs(page);
    await page.goto(`/en/traders/${WALLET}`);
    await page.getByRole('tab', { name: 'Trades' }).click();
    await expect(page).toHaveURL(/tab=trades/);
    await expect(page.getByRole('tab', { name: 'Trades' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('E64 predictions and swap show coming-soon with no fake data', async ({ page }) => {
    await seedAuth(page);
    await mockWalletTabs(page);
    await page.goto(`/en/traders/${WALLET}?tab=predictions`);
    await expect(page.getByText('Predictions coming soon')).toBeVisible();
    await expect(page.locator('#wallet-panel-predictions table')).toHaveCount(0);
    await page.getByRole('tab', { name: 'Swap' }).click();
    await expect(page.getByText('Swap coming soon')).toBeVisible();
    await expect(page.locator('#wallet-panel-swap table')).toHaveCount(0);
  });

  test('E65 positions sortable header sends server-side sort+dir', async ({ page }) => {
    await seedAuth(page);
    await mockWalletTabs(page);
    await page.goto(`/en/traders/${WALLET}`);
    await expect(page.getByText('BTC').first()).toBeVisible();
    const req = page.waitForRequest(
      (r) =>
        r.url().includes('/positions') &&
        new URL(r.url()).searchParams.get('sort') === 'unrealized_pnl',
    );
    await page.getByRole('button', { name: /uPnL/ }).click();
    const matched = await req;
    expect(new URL(matched.url()).searchParams.get('dir')).toBe('asc');
  });

  test('E66 positions empty state with ready status (no syncing)', async ({ page }) => {
    await seedAuth(page);
    await mockWalletTabs(page, {
      positions: { summary: null, positions: [], data_status: 'ready', as_of: null },
    });
    await page.goto(`/en/traders/${WALLET}`);
    await expect(page.getByText('No open positions')).toBeVisible();
    await expect(page.getByText('Syncing')).toHaveCount(0);
  });

  test('E67 trades table shows entry, exit, notional, duration, funding value and net pnl', async ({
    page,
  }) => {
    await seedAuth(page);
    await mockWalletTabs(page);
    await page.goto(`/en/traders/${WALLET}?tab=trades`);
    const panel = page.locator('#wallet-panel-trades');
    await expect(panel.getByText('BTC').first()).toBeVisible();
    await expect(panel.getByText('$60.00K')).toBeVisible();
    await expect(panel.getByText('$62.00K')).toBeVisible();
    await expect(panel.getByText('$30.50K')).toBeVisible();
    await expect(panel.getByText('2d 12h')).toBeVisible();
    // FUNDING is informational (−12.5); net 1470 = 1500 − 30 is unchanged.
    await expect(panel.getByText('-$12.5')).toBeVisible();
    await expect(panel.getByText('+$1,470')).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Win (1)' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Long (1)' })).toBeVisible();
  });

  test('E68 trades result filter shows only winners with stable counts', async ({ page }) => {
    await seedAuth(page);
    await mockWalletTabs(page);
    await page.goto(`/en/traders/${WALLET}?tab=trades`);
    const panel = page.locator('#wallet-panel-trades');
    await expect(panel.getByText('BTC').first()).toBeVisible();
    await expect(panel.getByText('ETH').first()).toBeVisible();
    await panel.getByRole('button', { name: 'Win (1)' }).click();
    await expect(panel.getByText('BTC').first()).toBeVisible();
    await expect(panel.getByText('ETH')).toHaveCount(0);
    await expect(panel.getByRole('button', { name: 'All (2)' }).first()).toBeVisible();
  });

  test('E69 trades side filter shows only shorts', async ({ page }) => {
    await seedAuth(page);
    await mockWalletTabs(page);
    await page.goto(`/en/traders/${WALLET}?tab=trades`);
    const panel = page.locator('#wallet-panel-trades');
    await expect(panel.getByText('BTC').first()).toBeVisible();
    await panel.getByRole('button', { name: 'Short (1)' }).click();
    await expect(panel.getByText('ETH').first()).toBeVisible();
    await expect(panel.getByText('BTC')).toHaveCount(0);
  });

  test('E70 trades sortable header sends server-side sort+dir', async ({ page }) => {
    await seedAuth(page);
    await mockWalletTabs(page);
    await page.goto(`/en/traders/${WALLET}?tab=trades`);
    const panel = page.locator('#wallet-panel-trades');
    await expect(panel.getByText('BTC').first()).toBeVisible();
    const req = page.waitForRequest(
      (r) =>
        r.url().includes('/activity') && new URL(r.url()).searchParams.get('sort') === 'net_pnl',
    );
    await panel.getByRole('button', { name: /Net PnL/ }).click();
    await req;
  });

  test('E71 trades empty state', async ({ page }) => {
    await seedAuth(page);
    await mockWalletTabs(page, {
      activityRows: [],
      activityCounts: { win: 0, loss: 0, long: 0, short: 0, total: 0 },
    });
    await page.goto(`/en/traders/${WALLET}?tab=trades`);
    await expect(page.locator('#wallet-panel-trades').getByText('No closed trades')).toBeVisible();
  });

  test('E72 balances shows perp and spot fields', async ({ page }) => {
    await seedAuth(page);
    await mockWalletTabs(page);
    await page.goto(`/en/traders/${WALLET}?tab=balances`);
    const panel = page.locator('#wallet-panel-balances');
    await expect(panel.getByText('Withdrawable')).toBeVisible();
    await expect(panel.getByText('$11.00K')).toBeVisible();
    await expect(panel.getByText('HYPE')).toBeVisible();
    await expect(panel.getByText('USDC')).toBeVisible();
  });

  test('E73 fills table matches the contract shape', async ({ page }) => {
    await seedAuth(page);
    await mockWalletTabs(page);
    await page.goto(`/en/traders/${WALLET}?tab=fills`);
    const panel = page.locator('#wallet-panel-fills');
    await expect(panel.getByText('ETH')).toBeVisible();
    await expect(panel.getByText('SELL')).toBeVisible();
    await expect(panel.getByText('Close Long')).toBeVisible();
  });

  test('E74 orders open lacks status fields while historical has them', async ({ page }) => {
    await seedAuth(page);
    await mockWalletTabs(page);
    await page.goto(`/en/traders/${WALLET}?tab=orders`);
    const panel = page.locator('#wallet-panel-orders');
    await expect(panel.getByText('91,490,942')).toBeVisible();
    await expect(panel.getByText('filled')).toHaveCount(0);
    await panel.getByRole('button', { name: 'Historical' }).click();
    await expect(panel.getByText('filled')).toBeVisible();
  });

  test('E75 transfers shows the enum type row', async ({ page }) => {
    await seedAuth(page);
    await mockWalletTabs(page);
    await page.goto(`/en/traders/${WALLET}?tab=transfers`);
    const panel = page.locator('#wallet-panel-transfers');
    await expect(panel.getByText('subAccountTransfer')).toBeVisible();
    await expect(panel.getByText('$50.00K')).toBeVisible();
  });

  test('E76 performance shows metrics and the equity curve', async ({ page }) => {
    await seedAuth(page);
    await mockWalletTabs(page);
    await page.goto(`/en/traders/${WALLET}?tab=performance`);
    const panel = page.locator('#wallet-panel-performance');
    await expect(panel.getByText('Equity curve')).toBeVisible();
    await expect(panel.getByText('2026-10-01')).toBeVisible();
    await expect(panel.getByText('$10.00K')).toBeVisible();
  });

  test('E77 balances error recovers on retry', async ({ page }) => {
    await seedAuth(page);
    await mockWalletTabs(page, { failBalancesTimes: 4 });
    await page.goto(`/en/traders/${WALLET}?tab=balances`);
    const panel = page.locator('#wallet-panel-balances');
    await expect(panel.getByRole('button', { name: 'Retry' })).toBeVisible({ timeout: 20000 });
    await panel.getByRole('button', { name: 'Retry' }).click();
    await expect(panel.getByText('Perp account')).toBeVisible();
  });

  test('E78 vietnamese locale renders translated tabs', async ({ page }) => {
    await seedAuth(page);
    await mockWalletTabs(page);
    await page.goto(`/vi/traders/${WALLET}?tab=trades`);
    await expect(page.getByRole('tab', { name: 'Giao dịch' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.locator('#wallet-panel-trades').getByText('BTC').first()).toBeVisible();
  });
});
