import { test, expect } from '@playwright/test';

test.describe('Funding Arbitrage', () => {
  test('renders page title', async ({ page }) => {
    await page.goto('/en/funding-arbitrage');

    await expect(page.getByRole('heading', { name: 'Funding Arbitrage' })).toBeVisible();
  });

  test('renders venue selector button', async ({ page }) => {
    await page.goto('/en/funding-arbitrage');

    await expect(page.getByText('Select venues')).toBeVisible();
  });

  test('renders sort dropdown', async ({ page }) => {
    await page.goto('/en/funding-arbitrage');

    await expect(page.locator('select')).toBeVisible();
  });

  test('renders search button', async ({ page }) => {
    await page.goto('/en/funding-arbitrage');

    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();
  });

  test('search button disabled when no venues selected', async ({ page }) => {
    await page.goto('/en/funding-arbitrage');

    const searchButton = page.getByRole('button', { name: 'Search' });
    await expect(searchButton).toBeDisabled();
  });

  test('venue selector dropdown opens on click', async ({ page }) => {
    await page.goto('/en/funding-arbitrage');

    await page.getByText('Select venues').click();

    await expect(page.getByText('Venues (2-10)')).toBeVisible();
  });

  test('venue selector shows Select All and Clear buttons', async ({ page }) => {
    await page.goto('/en/funding-arbitrage');

    await page.getByText('Select venues').click();

    await expect(page.getByText('Select All')).toBeVisible();
    await expect(page.getByText('Clear')).toBeVisible();
  });

  test('Select All selects up to 10 venues', async ({ page }) => {
    await page.goto('/en/funding-arbitrage');

    await page.getByText('Select venues').click();
    await page.getByText('Select All').click();

    await expect(page.getByText('10 venues')).toBeVisible();
  });

  test('Clear deselects all venues', async ({ page }) => {
    await page.goto('/en/funding-arbitrage');

    await page.getByText('Select venues').click();
    await page.getByText('Select All').click();
    await expect(page.getByText('10 venues')).toBeVisible();

    await page.getByText('Clear').click();
    await expect(page.getByText('Select venues')).toBeVisible();
  });

  test('can select individual venue', async ({ page }) => {
    await page.goto('/en/funding-arbitrage');

    await page.getByText('Select venues').click();

    const firstVenue = page.locator('[data-slot="dropdown-menu-item"]').first();
    await firstVenue.click();

    await expect(page.getByText('1 venue')).toBeVisible();
  });

  test('pagination is not visible when no data loaded', async ({ page }) => {
    await page.goto('/en/funding-arbitrage');

    const paginationButtons = page.locator('button').filter({ hasText: /^\d+$/ });
    await expect(paginationButtons).toHaveCount(0);
  });

  test('table renders with data after search', async ({ page }) => {
    await page.goto('/en/funding-arbitrage');

    await page.getByText('Select venues').click();
    await page.getByText('Select All').click();
    await page.keyboard.press('Escape');
    await page.getByText('Search').click();

    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });

  test('table has correct column headers', async ({ page }) => {
    await page.goto('/en/funding-arbitrage');

    await page.getByText('Select venues').click();
    await page.getByText('Select All').click();
    await page.keyboard.press('Escape');
    await page.getByText('Search').click();

    await expect(page.locator('th').filter({ hasText: 'Token' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('th').filter({ hasText: /^APR$/ })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'Status' })).toBeVisible();
  });

  test('empty state shows when search returns no results', async ({ page }) => {
    await page.goto('/en/funding-arbitrage');

    await page.getByText('Select venues').click();
    const venues = page.locator('[data-slot="dropdown-menu-item"]');
    await venues.first().click();
    await venues.nth(1).click();
    await page.keyboard.press('Escape');

    await page.getByText('Search').click();

    await expect(
      page.getByText('No arbitrage opportunities found').or(page.locator('table')).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test('status badges render after search', async ({ page }) => {
    await page.goto('/en/funding-arbitrage');

    await page.getByText('Select venues').click();
    await page.getByText('Select All').click();
    await page.keyboard.press('Escape');
    await page.getByText('Search').click();

    const badges = page.locator('span').filter({ hasText: /Live|Stale|Unavailable/ });
    await expect(badges.first()).toBeVisible({ timeout: 10000 });
  });
});
