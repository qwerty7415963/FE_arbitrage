import { test, expect } from '@playwright/test';
import { loginUser, expectLoginPage } from '../helpers';

test.describe('Logout', () => {
  test('logs out and redirects to login', async ({ page }) => {
    await loginUser(page);
    await expect(page).toHaveURL(/\/dashboard/);

    const userMenu = page.locator('[data-slot="dropdown-menu-trigger"]').first();
    await userMenu.click();

    const logoutButton = page.getByText('Logout');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    await expectLoginPage(page);
  });

  test('clears user state after logout', async ({ page }) => {
    await loginUser(page);
    await expect(page).toHaveURL(/\/dashboard/);

    const userMenu = page.locator('[data-slot="dropdown-menu-trigger"]').first();
    await userMenu.click();
    await page.getByText('Logout').click();

    await expectLoginPage(page);

    await page.goto('/en/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
