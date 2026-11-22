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
  pnl_buckets: [],
  account_buckets: [],
  coverage: {
    pnl_wallets: 10,
    account_value_wallets: 8,
    series_wallets: 6,
    data_status: { ready: 9, stale: 1, error: 0, syncing: 0 },
  },
};

test.describe('i18n switch', () => {
  test('switches vi to en on overview', async ({ page }) => {
    await seedAuth(page);
    await page.route('**/api/v1/traders/overview**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockOverview }),
      }),
    );

    await page.goto('/vi/traders/overview');
    await expect(page.getByRole('heading', { name: 'Tổng quan nhà giao dịch' })).toBeVisible();

    const descBefore = await page.locator('meta[name="description"]').getAttribute('content');

    await page.getByRole('button', { name: /ngôn ngữ|language/i }).click();
    await page.getByRole('menuitem', { name: 'English' }).click();

    await expect(page).toHaveURL(/\/en\/traders\/overview/);
    await expect(page.getByRole('heading', { name: 'Trader Overview' })).toBeVisible();

    const descAfter = await page.locator('meta[name="description"]').getAttribute('content');
    expect(descAfter).not.toBe(descBefore);
  });

  test('switches en to vi on traders', async ({ page }) => {
    await seedAuth(page);
    await page.route('**/api/v1/traders/search**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          meta: { page: 1, total_pages: 1, total: 0 },
        }),
      }),
    );

    await page.goto('/en/traders');
    await expect(page.getByRole('heading', { name: 'Trader Scanner' })).toBeVisible();

    await page.getByRole('button', { name: /language|ngôn ngữ/i }).click();
    await page.getByRole('menuitem', { name: /Ti/i }).click();

    await expect(page).toHaveURL(/\/vi\/traders$/);
    await expect(page.getByRole('heading', { name: 'Quét trader' })).toBeVisible();
  });

  test('mobile viewport renders Vietnamese text', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await seedAuth(page);
    await page.route('**/api/v1/traders/overview**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockOverview }),
      }),
    );

    await page.goto('/vi/traders/overview');
    await expect(page.getByRole('heading', { name: 'Tổng quan nhà giao dịch' })).toBeVisible();
  });
});
