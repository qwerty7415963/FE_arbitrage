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

test.describe('Groups', () => {
  test('renders groups page title', async ({ page }) => {
    await page.goto('/en/groups');
    await expect(page.getByRole('heading', { name: 'Groups' })).toBeVisible();
  });

  test('renders create button', async ({ page }) => {
    await page.goto('/en/groups');
    await expect(page.getByRole('button', { name: 'Create' }).first()).toBeVisible();
  });

  test('shows empty state when no groups', async ({ page }) => {
    await page.route('**/api/v1/groups', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      }),
    );
    await page.goto('/en/groups');
    await expect(page.getByText('No groups yet')).toBeVisible();
  });

  test('create group dialog opens and validates blank name', async ({ page }) => {
    await seedAuth(page);
    await page.route('**/api/v1/groups', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      }),
    );
    await page.goto('/en/groups');
    await page.getByRole('button', { name: 'Create' }).first().click();
    await expect(page.getByText('Create group')).toBeVisible();

    await page.fill('#group-name', '   ');
    await page.getByRole('button', { name: 'Create' }).last().click();
    await expect(page.getByText('Group name is required')).toBeVisible();
  });

  test('lists groups from API', async ({ page }) => {
    await page.route('**/api/v1/groups', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'g1',
              name: 'Main',
              description: 'desc',
              wallet_count: 2,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          ],
        }),
      }),
    );
    await page.goto('/en/groups');
    await expect(page.getByText('Main')).toBeVisible();
    await expect(page.getByText('2')).toBeVisible();
  });

  test('shows retry on API error', async ({ page }) => {
    await page.route('**/api/v1/groups', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: { code: 'INTERNAL', message: 'boom' } }),
      }),
    );
    await page.goto('/en/groups');
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  });
});

test.describe('Group Detail Membership', () => {
  const mockGroup = {
    id: 'g1',
    name: 'Main',
    description: 'desc',
    wallet_count: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockWallet = {
    id: 'w1',
    chain: 'evm',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    dex: 'hyperliquid',
    tag: 'main',
    first_seen_at: '2024-01-01T00:00:00Z',
    last_seen_at: '2024-01-02T00:00:00Z',
    added_at: '2024-01-03T00:00:00Z',
    metrics: {
      realized_pnl: 123.45,
      roi: 12.5,
      volume: 1000000,
      avg_position: 5000,
      avg_leverage: 3,
      win_rate: 66.66,
      trade_count: 42,
      long_count: 28,
      short_count: 14,
      computed_at: '2024-01-02T00:00:00Z',
      last_active_at: '2024-01-02T00:00:00Z',
    },
  };

  async function mockDetail(page: Page, wallets: unknown[]) {
    await seedAuth(page);
    await page.route('**/api/v1/groups/g1', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockGroup }),
      }),
    );
    await page.route('**/api/v1/groups/g1/wallets*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: wallets,
          meta: { page: 1, total_pages: 1, limit: 10 },
        }),
      }),
    );
  }

  test('lists member wallets automatically', async ({ page }) => {
    await mockDetail(page, [mockWallet]);
    await page.goto('/en/groups/g1');
    await expect(page.getByText('0x1234...5678')).toBeVisible();
  });

  test('renders N/A for null metrics', async ({ page }) => {
    await mockDetail(page, [{ ...mockWallet, metrics: null, dex: null, tag: null }]);
    await page.goto('/en/groups/g1');
    await expect(page.getByText('N/A').first()).toBeVisible();
  });

  test('links to global scanner', async ({ page }) => {
    await mockDetail(page, [mockWallet]);
    await page.goto('/en/groups/g1');
    await expect(page.getByRole('link', { name: /Scan for more wallets/ })).toHaveAttribute(
      'href',
      /\/wallets\?group=g1/,
    );
  });
});

test.describe('Wallet Scanner', () => {
  const mockTrader = {
    wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
    venue: 'hyperliquid',
    venue_id: null,
    period: '30D',
    display_name: 'Smart Money',
    pnl: 12345.67,
    realized_pnl: 12345.67,
    roi: 12.5,
    win_rate: 66.66,
    volume: 1000000,
    trade_count: 42,
    profit_factor: 1.85,
    max_drawdown_pct: null,
    long_count: 28,
    long_wins: 20,
    short_count: 14,
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

  async function mockGroupsRoute(page: Page, groups: unknown[] = []) {
    await page.route('**/api/v1/trader-groups', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: groups }),
      }),
    );
  }

  test('renders scanner filters and scans to list', async ({ page }) => {
    await seedAuth(page);
    const bodies: Record<string, unknown>[] = [];
    await page.route('**/api/v1/traders/search', (route) => {
      bodies.push(JSON.parse(route.request().postData() || '{}'));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [mockTrader], meta: {} }),
      });
    });
    await mockGroupsRoute(page);
    await page.goto('/en/wallets');
    await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeVisible();
    expect(bodies).toHaveLength(0);
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('Smart Money')).toBeVisible();
    await expect(page.getByText('0x1234...5678')).toBeVisible();
    expect(bodies[0]).toMatchObject({
      venue: 'hyperliquid',
      period: '30D',
      sort_by: 'pnl',
      sort_direction: 'desc',
    });
  });

  test('invalid min/max blocks search without API call', async ({ page }) => {
    await seedAuth(page);
    let apiCalled = false;
    await page.route('**/api/v1/traders/search', (route) => {
      apiCalled = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });
    await mockGroupsRoute(page);
    await page.goto('/en/wallets');
    await page.getByLabel('ROI Min').fill('5');
    await page.getByLabel('ROI Max').fill('1');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('Min must be less than or equal to max')).toBeVisible();
    expect(apiCalled).toBe(false);
  });

  test('non-numeric filter blocks search without API call', async ({ page }) => {
    await seedAuth(page);
    let apiCalled = false;
    await page.route('**/api/v1/traders/search', (route) => {
      apiCalled = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });
    await mockGroupsRoute(page);
    await page.goto('/en/wallets');
    await page.getByLabel('PnL Min').fill('abc');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('Filter value must be a valid number')).toBeVisible();
    expect(apiCalled).toBe(false);
  });

  test('header click sorts desc then asc', async ({ page }) => {
    await seedAuth(page);
    const bodies: Record<string, unknown>[] = [];
    await page.route('**/api/v1/traders/search', (route) => {
      bodies.push(JSON.parse(route.request().postData() || '{}'));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [mockTrader], meta: {} }),
      });
    });
    await mockGroupsRoute(page);
    await page.goto('/en/wallets');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('Smart Money')).toBeVisible();
    expect(bodies[0]).toMatchObject({ sort_by: 'pnl', sort_direction: 'desc' });
    await page
      .getByRole('columnheader', { name: 'PnL' })
      .getByRole('button', { name: 'PnL' })
      .click();
    await expect.poll(() => bodies.length).toBe(2);
    expect(bodies[1]).toMatchObject({ sort_by: 'pnl', sort_direction: 'asc' });
  });

  test('cursor pagination appends rows without duplicates', async ({ page }) => {
    await seedAuth(page);
    const bodies: Record<string, unknown>[] = [];
    const second = { ...mockTrader, wallet_address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' };
    let calls = 0;
    await page.route('**/api/v1/traders/search', (route) => {
      bodies.push(JSON.parse(route.request().postData() || '{}'));
      calls += 1;
      const data = calls === 1 ? [mockTrader] : [mockTrader, second];
      const meta = calls === 1 ? { has_more: true, cursor: 'c1' } : { has_more: false };
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data, meta }),
      });
    });
    await mockGroupsRoute(page);
    await page.goto('/en/wallets');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('0x1234...5678')).toBeVisible();
    await page.getByRole('button', { name: 'Load more' }).click();
    await expect(page.getByText('0xbbbb...bbbb')).toBeVisible();
    expect(bodies[1]).toMatchObject({ cursor: 'c1' });
    await expect(page.getByText('0x1234...5678')).toHaveCount(1);
  });

  test('empty state offers reset filters', async ({ page }) => {
    await seedAuth(page);
    await page.route('**/api/v1/traders/search', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [], meta: {} }),
      }),
    );
    await mockGroupsRoute(page);
    await page.goto('/en/wallets');
    await page.getByLabel('ROI Min').fill('99');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('No traders found')).toBeVisible();
    await page.getByRole('button', { name: 'Reset filters' }).click();
    await expect(page.getByLabel('ROI Min')).toHaveValue('');
  });

  test('API error shows retry and recovers', async ({ page }) => {
    await seedAuth(page);
    let calls = 0;
    await page.route('**/api/v1/traders/search', (route) => {
      calls += 1;
      if (calls === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: { code: 'INTERNAL', message: 'boom' } }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [mockTrader], meta: {} }),
      });
    });
    await mockGroupsRoute(page);
    await page.goto('/en/wallets');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('An error occurred, please try again')).toBeVisible();
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByText('Smart Money')).toBeVisible();
  });

  test('add to group opens modal with selected traders', async ({ page }) => {
    await seedAuth(page);
    await page.route('**/api/v1/traders/search', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [mockTrader], meta: {} }),
      }),
    );
    await mockGroupsRoute(page, [{ id: 'g1', name: 'Main', member_count: 0 }]);
    await page.route('**/api/v1/trader-groups/g1/members', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { added: 1 } }),
      }),
    );
    await page.goto('/en/wallets');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByLabel('Select 0x1234567890abcdef1234567890abcdef12345678').click();
    await page.getByRole('button', { name: 'Add to group (1)', exact: true }).click();
    await expect(page.getByText('Add wallets to group')).toBeVisible();
    await expect(page.locator('[data-slot="dialog-content"]').getByText('Main')).toBeVisible();
    await page.locator('[data-slot="dialog-content"]').getByRole('radio', { name: /Main/ }).click();
    await page
      .locator('[data-slot="dialog-content"]')
      .getByRole('button', { name: 'Add 1' })
      .click();
    await expect(page.locator('[data-slot="dialog-content"]').getByText('Added 1')).toBeVisible();
  });

  test('group filter without auth shows auth message', async ({ page }) => {
    let searchCalled = false;
    await page.route('**/api/v1/traders/search', (route) => {
      searchCalled = true;
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { code: 'AUTH-003', message: 'group filter requires authentication' },
        }),
      });
    });
    await mockGroupsRoute(page, [{ id: 'g1', name: 'Main', member_count: 0 }]);
    await page.goto('/en/wallets');
    await page.getByLabel('Group').selectOption('g1');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('Group filter requires authentication')).toBeVisible();
    expect(searchCalled).toBe(true);
  });

  test('scan works without connecting wallet', async ({ page }) => {
    await page.route('**/api/v1/traders/search', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [mockTrader], meta: {} }),
      }),
    );
    await page.route('**/api/v1/trader-groups', (route) => route.abort());
    await page.goto('/en/wallets');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('0x1234...5678')).toBeVisible();
    await expect(page.getByText('Connect your wallet to filter by group')).toBeVisible();
  });

  test('save search persists across reload and re-applies filters', async ({ page }) => {
    await page.route('**/api/v1/traders/search', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [mockTrader], meta: {} }),
      }),
    );
    await mockGroupsRoute(page);
    await page.goto('/en/wallets');
    await page.getByLabel('Period').selectOption('7D');
    await page.getByLabel('ROI Min').fill('30');
    await page.getByRole('button', { name: 'Save search' }).click();
    await page.getByLabel('Search name').fill('My 7D');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('button', { name: 'My 7D', exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: 'My 7D', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'My 7D', exact: true }).click();
    await expect(page.getByText('0x1234...5678')).toBeVisible();
    await expect(page.getByLabel('Period')).toHaveValue('7D');
    await expect(page.getByLabel('ROI Min')).toHaveValue('30');
  });

  test('URL state restores filters on refresh', async ({ page }) => {
    const bodies: Record<string, unknown>[] = [];
    await page.route('**/api/v1/traders/search', (route) => {
      bodies.push(JSON.parse(route.request().postData() || '{}'));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [mockTrader], meta: {} }),
      });
    });
    await mockGroupsRoute(page);
    await page.goto('/en/wallets?period=7D&roi_min=30&sort_by=roi');
    await expect(page.getByText('Smart Money')).toBeVisible();
    await expect(page.getByLabel('Period')).toHaveValue('7D');
    await expect(page.getByLabel('ROI Min')).toHaveValue('30');
    expect(bodies[0]).toMatchObject({ period: '7D', roi_min: 30, sort_by: 'roi' });
  });

  test('search sends venue and period params', async ({ page }) => {
    const bodies: Record<string, unknown>[] = [];
    await page.route('**/api/v1/traders/search', (route) => {
      bodies.push(JSON.parse(route.request().postData() || '{}'));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [mockTrader], meta: {} }),
      });
    });
    await mockGroupsRoute(page);
    await page.goto('/en/wallets');
    await page.getByLabel('Period').selectOption('7D');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('0x1234...5678')).toBeVisible();
    expect(bodies[0]).toMatchObject({ venue: 'hyperliquid', period: '7D' });
  });
});
