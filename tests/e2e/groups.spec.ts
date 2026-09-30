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
  const mockWallet = {
    id: 'w1',
    chain: 'evm',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    dex: 'hyperliquid',
    tag: 'main',
    first_seen_at: '2024-01-01T00:00:00Z',
    last_seen_at: '2024-01-02T00:00:00Z',
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

  test('renders scanner filters and scans to list', async ({ page }) => {
    await seedAuth(page);
    await page.route('**/api/v1/wallets*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [mockWallet],
          meta: { page: 1, total_pages: 1, limit: 10, total: 1 },
        }),
      }),
    );
    await page.goto('/en/wallets');
    await expect(page.getByRole('button', { name: 'Scan' })).toBeVisible();
    await page.getByRole('button', { name: 'Scan' }).click();
    await expect(page.getByText('0x1234...5678')).toBeVisible();
  });

  test('invalid between filter blocks scan without API call', async ({ page }) => {
    await seedAuth(page);
    let apiCalled = false;
    await page.route('**/api/v1/wallets*', (route) => {
      apiCalled = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });
    await page.goto('/en/wallets');
    await page.getByRole('button', { name: 'Filter' }).click();
    const selects = page.locator('select');
    await selects.nth(3).selectOption('roi');
    await selects.nth(4).selectOption('between');
    await page.locator('input').nth(2).fill('5');
    await page.locator('input').nth(3).fill('1');
    await page.getByRole('button', { name: 'Scan' }).click();
    await expect(page.getByText('Min must be less than or equal to max')).toBeVisible();
    expect(apiCalled).toBe(false);
  });

  test('add to group opens modal with selected wallets', async ({ page }) => {
    await seedAuth(page);
    await page.route('**/api/v1/wallets*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [mockWallet],
          meta: { page: 1, total_pages: 1, limit: 10, total: 1 },
        }),
      }),
    );
    await page.route('**/api/v1/groups', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'g1', name: 'Main', wallet_count: 0 }],
        }),
      }),
    );
    await page.goto('/en/wallets');
    await page.getByRole('button', { name: 'Scan' }).click();
    await page.getByLabel('Select 0x1234567890abcdef1234567890abcdef12345678').click();
    await page.getByRole('button', { name: /Add to group/ }).click();
    await expect(page.getByText('Add wallets to group')).toBeVisible();
    await expect(page.locator('[data-slot="dialog-content"]').getByText('Main')).toBeVisible();
  });

  test('scan works without connecting wallet', async ({ page }) => {
    await page.route('**/api/v1/wallets*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [mockWallet],
          meta: { page: 1, total_pages: 1, limit: 10, total: 1 },
        }),
      }),
    );
    await page.goto('/en/wallets');
    await page.getByRole('button', { name: 'Scan' }).click();
    await expect(page.getByText('0x1234...5678')).toBeVisible();
    await expect(page.getByText('Connect wallet required')).not.toBeVisible();
  });

  test('save search persists across reload and re-applies filters', async ({ page }) => {
    await page.route('**/api/v1/wallets*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [mockWallet],
          meta: { page: 1, total_pages: 1, limit: 10, total: 1 },
        }),
      }),
    );
    await page.goto('/en/wallets');
    await page.getByLabel('Timeframe').selectOption('7D');
    await page.getByRole('button', { name: 'Save search' }).click();
    await page.getByLabel('Search name').fill('My 7D');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('button', { name: 'My 7D', exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: 'My 7D', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'My 7D', exact: true }).click();
    await expect(page.getByText('0x1234...5678')).toBeVisible();
    await expect(page.getByLabel('Timeframe')).toHaveValue('7D');
  });
});
