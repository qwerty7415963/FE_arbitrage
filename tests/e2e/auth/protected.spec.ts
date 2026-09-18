import { test, expect } from '@playwright/test';
import { loginUser } from '../helpers';

test.describe('Protected Routes', () => {
  test('redirects to login when no token', async ({ page }) => {
    await page.goto('/en/dashboard');

    await expect(page).toHaveURL(/\/login/);
  });

  test('allows access with valid token', async ({ page }) => {
    await loginUser(page);
    await expect(page).toHaveURL(/\/dashboard/);

    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('redirects to login after token expiry', async ({ page }) => {
    await loginUser(page);
    await expect(page).toHaveURL(/\/dashboard/);

    await page.evaluate(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    });

    await page.goto('/en/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
