import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

function makeTrader(i: number) {
  const hex = i.toString(16).padStart(40, '0');
  return {
    wallet_address: `0x${hex}`,
    venue: 'hyperliquid',
    venue_id: null,
    period: '30D',
    display_name: `Trader ${i}`,
    pnl: i * 100,
    realized_pnl: i * 100,
    roi: 10,
    win_rate: 60,
    volume: 5000,
    trade_count: 20,
    profit_factor: 1.5,
    max_drawdown_pct: null,
    long_count: 10,
    long_wins: 6,
    short_count: 10,
    short_wins: 6,
    gross_profit: null,
    gross_loss: null,
    avg_trade_pnl: null,
    avg_holding_time_sec: null,
    last_trade_at: '2024-01-02T00:00:00Z',
    data_status: 'ready',
    is_partial: false,
    metrics_as_of: '2024-01-02T01:00:00Z',
    calculation_version: 1,
  };
}

async function applyFilters(page: Page) {
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
}

test.describe('Scanner numbered pagination', () => {
  test('page click sends page:2 and replaces rows', async ({ page }) => {
    const bodies: Record<string, unknown>[] = [];
    await page.route('**/api/v1/traders/search', (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      bodies.push(body);
      const requestedPage = typeof body.page === 'number' ? body.page : 1;
      const data = requestedPage === 2 ? [makeTrader(21)] : [makeTrader(1)];
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data,
          meta: { page: requestedPage, total: 40, total_pages: 2 },
        }),
      });
    });
    await page.goto('/en/traders');
    await applyFilters(page);
    await expect(page.getByText('Trader 1')).toBeVisible();
    await expect(page.getByText('Page 1 of 2 · 40 results')).toBeVisible();
    await page.getByRole('button', { name: 'Page 2' }).click();
    await expect(page.getByText('Trader 21')).toBeVisible();
    await expect(page.getByText('Trader 1')).toHaveCount(0);
    expect(bodies[bodies.length - 1]).toMatchObject({ page: 2 });
    await expect(page).toHaveURL(/page=2/);
  });

  test('deep link ?page=3 searches with page 3', async ({ page }) => {
    const bodies: Record<string, unknown>[] = [];
    await page.route('**/api/v1/traders/search', (route) => {
      bodies.push(JSON.parse(route.request().postData() || '{}'));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [makeTrader(41)],
          meta: { page: 3, total: 60, total_pages: 3 },
        }),
      });
    });
    await page.goto('/en/traders?page=3');
    await expect(page.getByText('Trader 41')).toBeVisible();
    expect(bodies[0]).toMatchObject({ page: 3 });
    await expect(page.getByRole('button', { name: 'Page 3' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('back/forward restores the page', async ({ page }) => {
    await page.route('**/api/v1/traders/search', (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      const requestedPage = typeof body.page === 'number' ? body.page : 1;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [makeTrader(requestedPage)],
          meta: { page: requestedPage, total: 60, total_pages: 3 },
        }),
      });
    });
    await page.goto('/en/traders');
    await applyFilters(page);
    await expect(page.getByText('Trader 1')).toBeVisible();
    await page.getByRole('button', { name: 'Page 2' }).click();
    await expect(page.getByText('Trader 2')).toBeVisible();
    await expect(page).toHaveURL(/page=2/);
    await page.goBack();
    await expect(page.getByText('Trader 1')).toBeVisible();
    await page.goForward();
    await expect(page.getByText('Trader 2')).toBeVisible();
  });

  test('page beyond total clamps to the last page', async ({ page }) => {
    const bodies: Record<string, unknown>[] = [];
    await page.route('**/api/v1/traders/search', (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      bodies.push(body);
      const requestedPage = typeof body.page === 'number' ? body.page : 1;
      if (requestedPage > 2) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            meta: { page: requestedPage, total: 40, total_pages: 2 },
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [makeTrader(21)],
          meta: { page: requestedPage, total: 40, total_pages: 2 },
        }),
      });
    });
    await page.goto('/en/traders?page=9');
    await expect(page.getByText('Trader 21')).toBeVisible();
    expect(bodies[bodies.length - 1]).toMatchObject({ page: 2 });
    await expect(page.getByText('Page 2 of 2 · 40 results')).toBeVisible();
  });

  test('rapid 2->3 clicks: latest wins', async ({ page }) => {
    await page.route('**/api/v1/traders/search', (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      const requestedPage = typeof body.page === 'number' ? body.page : 1;
      if (requestedPage === 1) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [makeTrader(1)],
            meta: { page: 1, total: 60, total_pages: 3 },
          }),
        });
      }
      const delay = requestedPage === 2 ? 400 : 0;
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          void route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: [makeTrader(requestedPage)],
              meta: { page: requestedPage, total: 60, total_pages: 3 },
            }),
          });
          resolve();
        }, delay);
      });
    });
    await page.goto('/en/traders');
    await applyFilters(page);
    await expect(page.getByText('Trader 1')).toBeVisible();
    await page.getByRole('button', { name: 'Page 2' }).click();
    await page.getByRole('button', { name: 'Page 3' }).click();
    await expect(page.getByText('Trader 3')).toBeVisible();
    await expect(page.getByText('Trader 2')).toHaveCount(0);
  });

  test('500 on page 2 keeps the page after retry', async ({ page }) => {
    let failsLeft = 1;
    const bodies: Record<string, unknown>[] = [];
    await page.route('**/api/v1/traders/search', (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      bodies.push(body);
      if (typeof body.page === 'number' && body.page === 2 && failsLeft > 0) {
        failsLeft -= 1;
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: { code: 'INTERNAL', message: 'boom' } }),
        });
      }
      const requestedPage = typeof body.page === 'number' ? body.page : 1;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [makeTrader(requestedPage)],
          meta: { page: requestedPage, total: 40, total_pages: 2 },
        }),
      });
    });
    await page.goto('/en/traders');
    await applyFilters(page);
    await expect(page.getByText('Trader 1')).toBeVisible();
    await page.getByRole('button', { name: 'Page 2' }).click();
    await expect(page.getByText('An error occurred, please try again')).toBeVisible();
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByText('Trader 2')).toBeVisible();
    expect(bodies[bodies.length - 1]).toMatchObject({ page: 2 });
    await expect(page).toHaveURL(/page=2/);
  });

  test('invalid ?page= clamps to 1', async ({ page }) => {
    const bodies: Record<string, unknown>[] = [];
    await page.route('**/api/v1/traders/search', (route) => {
      bodies.push(JSON.parse(route.request().postData() || '{}'));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [makeTrader(1)],
          meta: { page: 1, total: 20, total_pages: 1 },
        }),
      });
    });
    await page.goto('/en/traders?page=0');
    await expect(page.getByText('Trader 1')).toBeVisible();
    expect(bodies[0]).toMatchObject({ page: 1 });
  });

  test('paginated results have no axe violations', async ({ page }) => {
    await page.route('**/api/v1/traders/search', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [makeTrader(1)],
          meta: { page: 1, total: 40, total_pages: 2 },
        }),
      }),
    );
    await page.goto('/en/traders');
    await applyFilters(page);
    await expect(page.getByText('Trader 1')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });

  test('pagination is keyboard operable', async ({ page }) => {
    await page.route('**/api/v1/traders/search', (route) => {
      const body = JSON.parse(route.request().postData() || '{}');
      const requestedPage = typeof body.page === 'number' ? body.page : 1;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [makeTrader(requestedPage)],
          meta: { page: requestedPage, total: 40, total_pages: 2 },
        }),
      });
    });
    await page.goto('/en/traders');
    await applyFilters(page);
    await expect(page.getByText('Trader 1')).toBeVisible();
    await page.getByRole('button', { name: 'Page 2' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Trader 2')).toBeVisible();
  });

  test.describe('narrow viewport', () => {
    test.use({ viewport: { width: 640, height: 900 } });

    test('pagination does not overflow the page', async ({ page }) => {
      await page.route('**/api/v1/traders/search', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [makeTrader(1)],
            meta: { page: 1, total: 200, total_pages: 10 },
          }),
        }),
      );
      await page.goto('/en/traders');
      await applyFilters(page);
      await expect(page.getByText('Trader 1')).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Pagination' })).toBeVisible();
      const overflow = await page.evaluate(() => {
        const doc = document.scrollingElement as HTMLElement;
        const nav = document.querySelector('nav[aria-label="Pagination"]') as HTMLElement | null;
        return {
          pageOverflow: doc.scrollWidth - doc.clientWidth,
          navOverflow: nav ? nav.scrollWidth - nav.clientWidth : 0,
        };
      });
      expect(overflow.pageOverflow).toBeLessThanOrEqual(1);
      expect(overflow.navOverflow).toBeLessThanOrEqual(1);
    });
  });
});
