import { type Page, expect } from '@playwright/test';

export const TEST_EMAIL = 'test@example.com';
export const TEST_PASSWORD = 'password123';

export async function registerUser(page: Page, email = TEST_EMAIL, password = TEST_PASSWORD) {
  await page.goto('/en/register');
  await page.fill('input[type="email"]', email);
  await page.fill('input[id="password"]', password);
  await page.fill('input[id="confirmPassword"]', password);
  await page.click('button[type="submit"]');
}

export async function loginUser(page: Page, email = TEST_EMAIL, password = TEST_PASSWORD) {
  await page.goto('/en/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
}

export async function expectLoginPage(page: Page) {
  await expect(page).toHaveURL(/\/login/);
}

export async function expectFundingPage(page: Page) {
  await expect(page).toHaveURL(/\/funding-arbitrage/);
}

export async function logoutUser(page: Page) {
  const userMenu = page.locator('[data-slot="dropdown-menu-trigger"]').first();
  await userMenu.click();
  const logoutButton = page.getByText('Logout');
  await logoutButton.click();
}
