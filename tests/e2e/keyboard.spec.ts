import { test, expect, type Page } from '@playwright/test';

const TRADER = {
  wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
  venue: 'hyperliquid',
  venue_id: null,
  period: '30D',
  display_name: 'Smart Money',
  pnl: 5000,
  realized_pnl: 5000,
  roi: 25,
  win_rate: 70,
  volume: 100000,
  trade_count: 50,
  profit_factor: 2.1,
  max_drawdown_pct: null,
  long_count: 30,
  long_wins: 24,
  short_count: 20,
  short_wins: 10,
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

async function mockScanner(page: Page) {
  await page.route('**/api/v1/traders/search', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [TRADER], meta: {} }),
    }),
  );
  await page.route('**/api/v1/trader-groups', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    }),
  );
}

test.describe('Keyboard', () => {
  test('tab reaches all filter controls in order', async ({ page }) => {
    await mockScanner(page);
    await page.goto('/en/traders');
    await page.locator('body').click();
    const seen: string[] = [];
    for (let i = 0; i < 14; i += 1) {
      await page.keyboard.press('Tab');
      const label = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return '';
        const labelledBy = el.closest('label');
        const legend = labelledBy?.querySelector('span')?.textContent;
        if (legend) return legend.trim();
        return (
          el.getAttribute('aria-label') ||
          (el as HTMLInputElement).placeholder ||
          el.textContent ||
          ''
        ).trim();
      });
      seen.push(label);
    }
    for (const expected of ['Venue', 'Period', 'Group', 'Search', 'Reset']) {
      expect(seen).toContain(expected);
    }
  });

  test('sort header activates with Enter', async ({ page }) => {
    const bodies: Record<string, unknown>[] = [];
    await mockScanner(page);
    await page.route('**/api/v1/traders/search', (route) => {
      bodies.push(JSON.parse(route.request().postData() || '{}'));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [TRADER], meta: {} }),
      });
    });
    await page.goto('/en/traders');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('Smart Money')).toBeVisible();
    await page
      .getByRole('columnheader', { name: 'PnL' })
      .getByRole('button', { name: 'PnL' })
      .focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => bodies.length).toBe(2);
    expect(bodies[1]).toMatchObject({ sort_direction: 'asc' });
  });

  test('dialog traps focus and closes with Escape', async ({ page }) => {
    await page.route('**/api/v1/trader-groups', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      }),
    );
    await page.goto('/en/groups');
    await page.getByRole('button', { name: 'Create' }).first().click();
    const dialog = page.locator('[data-slot="dialog-content"]');
    await expect(dialog.getByText('Create group')).toBeVisible();
    for (let i = 0; i < 20; i += 1) {
      await page.keyboard.press('Tab');
      // Focus guards settle on the next animation frame; poll for the outcome.
      await expect
        .poll(
          () =>
            page.evaluate(() => {
              const el = document.activeElement as HTMLElement | null;
              if (!el) return false;
              return !!el.closest('[data-slot="dialog-content"]');
            }),
          { timeout: 2000 },
        )
        .toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test.describe('narrow viewport', () => {
    test.use({ viewport: { width: 640, height: 900 } });

    test('table scrolls internally without page overflow', async ({ page }) => {
      await mockScanner(page);
      await page.goto('/en/traders');
      await page.getByRole('button', { name: 'Search', exact: true }).click();
      await expect(page.getByText('Smart Money')).toBeVisible();
      const overflow = await page.evaluate(() => {
        const doc = document.scrollingElement as HTMLElement;
        const table = document.querySelector('[data-slot="table-container"]') as HTMLElement;
        return {
          pageOverflow: doc.scrollWidth - doc.clientWidth,
          tableScrollable: table.scrollWidth - table.clientWidth,
        };
      });
      expect(overflow.pageOverflow).toBeLessThanOrEqual(1);
      expect(overflow.tableScrollable).toBeGreaterThan(0);
    });
  });
});
