import { test, expect } from '@playwright/test';
import { loginUser } from './helpers';

test.describe('Groups', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await page.goto('/en/groups');
  });

  test('renders groups page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Groups' })).toBeVisible();
  });

  test('renders create button', async ({ page }) => {
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
