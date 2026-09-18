import { test, expect } from '@playwright/test';
import { loginUser, expectLoginPage, expectDashboardPage } from '../helpers';

test.describe('Login', () => {
  test('renders login form', async ({ page }) => {
    await page.goto('/en/login');

    await expect(page.getByText('Sign in')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('shows link to register page', async ({ page }) => {
    await page.goto('/en/login');

    const registerLink = page.getByText('Sign up');
    await expect(registerLink).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/en/login');

    await page.fill('input[type="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.text-destructive')).toBeVisible();
  });

  test('redirects to dashboard after successful login', async ({ page }) => {
    await loginUser(page);

    await expectDashboardPage(page);
  });
});
