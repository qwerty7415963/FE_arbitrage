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

test.describe('Settings global 401 policy', () => {
  test('unauthenticated visit shows connect CTA and never queries telegram status', async ({
    page,
  }) => {
    const statusRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/v1/telegram/status')) {
        statusRequests.push(request.url());
      }
    });

    await page.goto('/en/settings');

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(
      page.getByText('Connect your wallet to manage Telegram notifications.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Connect Wallet' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry' })).toHaveCount(0);
    expect(statusRequests).toHaveLength(0);
  });

  test('expired session shows the banner, expired copy and connect modal', async ({ page }) => {
    await seedAuth(page);
    await page.route('**/api/v1/telegram/status', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { code: 'AUTH-003', message: 'Session expired' },
        }),
      }),
    );
    await page.route('**/api/v1/auth/refresh', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { code: 'AUTH-003', message: 'Session expired' },
        }),
      }),
    );

    await page.goto('/en/settings');

    // The auto-opened modal marks the rest of the app aria-hidden, so read the
    // banner by attribute until the dialog is closed.
    await expect(page.locator('[role="status"]')).toContainText('Your session has expired');
    await expect(page.locator('[data-slot="dialog-content"]')).toContainText(
      'Connect wallet required',
    );
    await page.keyboard.press('Escape');

    const banner = page.getByRole('status');
    await expect(banner).toContainText('Your session has expired');
    await expect(
      page.getByText('Your session has expired. Reconnect your wallet to manage notifications.'),
    ).toBeVisible();
    await expect(page.getByText('Reconnect wallet', { exact: true }).first()).toBeVisible();

    await banner.getByRole('button', { name: 'Dismiss' }).click();
    await expect(banner).toHaveCount(0);
  });
});
