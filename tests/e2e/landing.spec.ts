import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('renders Vietnamese landing', async ({ page }) => {
    await page.goto('/vi');

    await expect(page).toHaveTitle(/HyperScan AI/);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Đọc ví trước khi vào lệnh. Bắt spread trước khi nó đóng.',
      }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Mở Trader Scanner' })).toHaveAttribute(
      'href',
      '/vi/traders',
    );
    await expect(page.getByRole('link', { name: 'Xem Funding Arbitrage' })).toHaveAttribute(
      'href',
      '/vi/funding-arbitrage',
    );
    await expect(page.getByRole('button', { name: /Kết nối ví|Connect wallet/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 2, name: 'FAQ' })).toBeVisible();
    await expect(page.getByText('Dữ liệu minh họa', { exact: true })).toBeVisible();
  });

  test('renders English landing', async ({ page }) => {
    await page.goto('/en');

    await expect(page).toHaveTitle(/HyperScan AI/);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Read the wallet before the trade. Catch the spread before it closes.',
      }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open Trader Scanner' })).toHaveAttribute(
      'href',
      '/en/traders',
    );
    await expect(page.getByRole('link', { name: 'View Funding Arbitrage' })).toHaveAttribute(
      'href',
      '/en/funding-arbitrage',
    );
    await expect(page.getByRole('button', { name: /Kết nối ví|Connect wallet/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 2, name: 'FAQ' })).toBeVisible();
    await expect(page.getByText('Illustrative data', { exact: true })).toBeVisible();
  });
});
