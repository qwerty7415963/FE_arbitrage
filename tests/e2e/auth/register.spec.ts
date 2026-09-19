import { test, expect } from '@playwright/test';
import { registerUser, expectFundingPage } from '../helpers';

test.describe('Register', () => {
  test('renders register form', async ({ page }) => {
    await page.goto('/en/register');

    await expect(page.getByText('Create account')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('input[id="confirmPassword"]')).toBeVisible();
  });

  test('shows link to login page', async ({ page }) => {
    await page.goto('/en/register');

    const loginLink = page.getByText('Sign in');
    await expect(loginLink).toBeVisible();
  });

  test('shows error for existing email', async ({ page }) => {
    await page.goto('/en/register');

    await page.fill('input[type="email"]', 'existing@test.com');
    await page.fill('input[id="password"]', 'password123');
    await page.fill('input[id="confirmPassword"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.locator('.text-destructive')).toBeVisible();
  });

  test('shows error for password mismatch', async ({ page }) => {
    await page.goto('/en/register');

    await page.fill('input[type="email"]', 'new@test.com');
    await page.fill('input[id="password"]', 'password123');
    await page.fill('input[id="confirmPassword"]', 'different123');
    await page.click('button[type="submit"]');

    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('redirects to funding arbitrage after successful registration', async ({ page }) => {
    const email = `user${Date.now()}@test.com`;
    await registerUser(page, email);

    await expectFundingPage(page);
  });
});
