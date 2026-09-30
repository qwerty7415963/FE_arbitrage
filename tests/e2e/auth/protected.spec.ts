import { test, expect } from '@playwright/test';

test.describe('Open Routes', () => {
  test('settings renders without auth redirect', async ({ page }) => {
    await page.goto('/en/settings');
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('groups renders without auth redirect', async ({ page }) => {
    await page.goto('/en/groups');
    await expect(page).toHaveURL(/\/groups/);
    await expect(page.getByRole('heading', { name: 'Groups' })).toBeVisible();
  });

  test('group mutation without auth opens connect wallet modal', async ({ page }) => {
    await page.route('**/api/v1/groups', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      }),
    );
    await page.goto('/en/groups');
    await page.getByRole('button', { name: 'Create' }).first().click();
    await page.fill('#group-name', 'Test group');
    await page.getByRole('button', { name: 'Create' }).last().click();
    await expect(page.getByText('Connect wallet required')).toBeVisible();
  });
});
