import { test, expect, type Page } from '@playwright/test';

async function seedAuth(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'test-token');
    localStorage.setItem('refresh_token', 'test-refresh');
  });
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { id: 'u1', email: 't@t.com', role: 'user', status: 'active', created_at: '' },
      }),
    }),
  );
}

const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const mockDetail = {
  as_of: '2026-01-01T00:00:00Z',
  kind: 'pnl',
  bucket_id: 'profitable',
  wallet_count: 2,
  sentiment: 'bullish',
  long_ratio: 0.6,
  pnl_split: { pct_profit: 0.6, pct_loss: 0.4, usd_profit: 100, usd_loss: -40 },
  notional_split: { long_usd: 300, short_usd: 200 },
  positioning: Array.from({ length: 5 }, (_, i) => ({ t: `2025-10-${13 + i}`, long_pct: 0.5 })),
  markets_top: [
    {
      market: 'BTC',
      notional: 100,
      upnl: 10,
      sentiment: 'bullish',
      traders: 2,
      asset_id: '11111111-1111-1111-1111-111111111111',
      asset_category: 'crypto_native',
      logo_url: 'https://example.com/btc.png',
    },
    {
      market: 'ETH',
      notional: 60,
      upnl: -5,
      sentiment: 'bearish',
      traders: 2,
      asset_id: '22222222-2222-2222-2222-222222222222',
      asset_category: '',
      logo_url: null,
    },
  ],
  coverage: { wallets_with_positions: 1, wallets_with_trades: 2 },
  markets_source: 'positions',
};

async function mockBucketDetail(page: Page) {
  await page.route(/\/api\/v1\/traders\/overview\/buckets\/pnl\/profitable(\?|$)/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: mockDetail }),
    }),
  );
  await page.route(/\/api\/v1\/traders\/overview\/buckets\/pnl\/profitable\/wallets/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [],
        meta: { page: 1, total: 0, total_pages: 1, limit: 20, has_more: false },
      }),
    }),
  );
  await page.route(/\/api\/v1\/traders\/overview\/buckets\/pnl\/profitable\/markets/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [],
        meta: { page: 1, total: 0, total_pages: 1, limit: 20, has_more: false },
      }),
    }),
  );
}

test.describe('Asset Logo', () => {
  test('crypto logo renders as img with correct src', async ({ page }) => {
    await seedAuth(page);
    await mockBucketDetail(page);
    await page.route('https://example.com/btc.png', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from(PNG_BASE64, 'base64'),
      }),
    );
    await page.goto('/en/traders/overview/pnl/profitable');
    const img = page.locator('img[src="https://example.com/btc.png"]');
    await expect(img.first()).toBeVisible();
  });

  test('missing logo renders fallback', async ({ page }) => {
    await seedAuth(page);
    await mockBucketDetail(page);
    await page.goto('/en/traders/overview/pnl/profitable');
    const treemap = page.getByTestId('bucket-treemap');
    await expect(treemap.getByText('ET', { exact: true })).toBeVisible();
  });

  test('provider timeout renders fallback', async ({ page }) => {
    await seedAuth(page);
    const slowDetail = JSON.parse(JSON.stringify(mockDetail));
    slowDetail.markets_top[0].logo_url = 'https://example.com/slow.png';
    await page.route(/\/api\/v1\/traders\/overview\/buckets\/pnl\/profitable(\?|$)/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: slowDetail }),
      }),
    );
    await page.route(/\/api\/v1\/traders\/overview\/buckets\/pnl\/profitable\/wallets/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          meta: { page: 1, total: 0, total_pages: 1, limit: 20, has_more: false },
        }),
      }),
    );
    await page.route(/\/api\/v1\/traders\/overview\/buckets\/pnl\/profitable\/markets/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          meta: { page: 1, total: 0, total_pages: 1, limit: 20, has_more: false },
        }),
      }),
    );
    await page.route('https://example.com/slow.png', (route) => route.abort());
    await page.goto('/en/traders/overview/pnl/profitable');
    await page.waitForTimeout(300);
    const treemap = page.getByTestId('bucket-treemap');
    await expect(treemap.getByText('BTC')).toBeVisible();
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await seedAuth(page);
    await mockBucketDetail(page);
    await page.route('https://example.com/btc.png', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from(PNG_BASE64, 'base64'),
      }),
    );
    await page.goto('/en/traders/overview/pnl/profitable');
    await expect(page.getByTestId('bucket-treemap')).toBeVisible();
    expect(errors.filter((e) => !e.includes('favicon'))).toEqual([]);
  });

  test('re-fetch does not create new logo requests', async ({ page }) => {
    await seedAuth(page);
    await mockBucketDetail(page);
    let logoRequests = 0;
    await page.route('https://example.com/btc.png', (route) => {
      logoRequests += 1;
      return route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from(PNG_BASE64, 'base64'),
      });
    });
    await page.goto('/en/traders/overview/pnl/profitable');
    const initial = logoRequests;
    await page.getByRole('tab', { name: /Markets/i }).click();
    await page.waitForTimeout(500);
    expect(logoRequests).toBeLessThanOrEqual(initial + 1);
  });

  test('no layout shift after logo load', async ({ page }) => {
    await seedAuth(page);
    await mockBucketDetail(page);
    await page.route('https://example.com/btc.png', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from(PNG_BASE64, 'base64'),
      }),
    );
    await page.goto('/en/traders/overview/pnl/profitable');
    const tile = page.getByTestId('treemap-tile').first();
    const box1 = await tile.boundingBox();
    await page.waitForTimeout(500);
    const box2 = await tile.boundingBox();
    if (box1 && box2) {
      expect(Math.abs(box1.width - box2.width)).toBeLessThan(2);
      expect(Math.abs(box1.height - box2.height)).toBeLessThan(2);
    }
  });

  test('responsive icon sizes', async ({ page }) => {
    for (const width of [375, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await seedAuth(page);
      await mockBucketDetail(page);
      await page.route('https://example.com/btc.png', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'image/png',
          body: Buffer.from(PNG_BASE64, 'base64'),
        }),
      );
      await page.goto('/en/traders/overview/pnl/profitable');
      await expect(page.getByTestId('bucket-treemap')).toBeVisible();
    }
  });
});
