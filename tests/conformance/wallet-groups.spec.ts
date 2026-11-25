import { test, expect, type Page } from '@playwright/test';
import {
  sampleGroupAlert,
  sampleGroupAlertEvent,
  sampleGroupActivity,
  sampleGroupPerformance,
  sampleGroupPositions,
  sampleGroupStats,
  sampleGroups,
  sampleGroupsOverview,
  sampleCompareResponse,
} from '../fixtures/wallet-groups/sample';

const MODE = process.env.CONFORMANCE_MODE ?? 'mock';
const isMock = MODE === 'mock';

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

async function mockAll(page: Page) {
  let alerts: unknown[] = [];

  await page.route(/\/api\/v1\/trader-groups(\?.*)?$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: sampleGroups,
        meta: { page: 1, total_pages: 1, total: sampleGroups.length, limit: 20 },
      }),
    }),
  );
  await page.route(/\/api\/v1\/trader-groups\/overview(\?.*)?$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: sampleGroupsOverview }),
    }),
  );
  await page.route(/\/api\/v1\/trader-groups\/[^/]+\/stats(\?.*)?$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: sampleGroupStats }),
    }),
  );
  await page.route(/\/api\/v1\/trader-groups\/[^/]+\/performance(\?.*)?$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: sampleGroupPerformance }),
    }),
  );
  await page.route(/\/api\/v1\/trader-groups\/[^/]+\/positions(\?.*)?$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: sampleGroupPositions }),
    }),
  );
  await page.route(/\/api\/v1\/trader-groups\/[^/]+\/activity(\?.*)?$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: sampleGroupActivity }),
    }),
  );
  await page.route(/\/api\/v1\/trader-groups\/[^/]+\/alerts(\?.*)?$/, (route) => {
    if (route.request().method() === 'POST') {
      alerts = [sampleGroupAlert];
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: sampleGroupAlert }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: alerts }),
    });
  });
  await page.route(/\/api\/v1\/trader-alerts\/[^/]+(\?.*)?$/, (route) => {
    if (route.request().method() === 'DELETE') {
      alerts = [];
      return route.fulfill({ status: 204, body: '' });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: sampleGroupAlert }),
    });
  });
  await page.route(/\/api\/v1\/trader-groups\/[^/]+\/alert-events(\?.*)?$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          items: [sampleGroupAlertEvent],
          next_cursor: null,
          has_more: false,
          unread_count: 1,
        },
      }),
    }),
  );
  await page.route(/\/api\/v1\/trader-groups\/compare(\?.*)?$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: sampleCompareResponse }),
    }),
  );
}

async function api(page: Page, path: string, init?: { method?: string; body?: string }) {
  return page.evaluate(
    async ({ path, init }) => {
      const token = localStorage.getItem('access_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(path, {
        method: init?.method,
        body: init?.body,
        headers,
        credentials: 'include',
      });
      const body = await res.json().catch(() => null);
      return { status: res.status, body };
    },
    { path, init },
  );
}

test.beforeEach(async ({ page }) => {
  if (isMock) await mockAll(page);
  else await seedAuth(page);
  await page.goto('/');
});

test.describe('Conformance', () => {
  test('list returns array with member_count and is_favorite', async ({ page }) => {
    const r = await api(page, '/api/v1/trader-groups');
    const data = r.body?.data ?? r.body;
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]).toHaveProperty('member_count');
    expect(data[0]).toHaveProperty('is_favorite');
  });

  test('overview returns total_groups/unique_wallets', async ({ page }) => {
    const r = await api(page, '/api/v1/trader-groups/overview?period=30D');
    const data = r.body?.data ?? r.body;
    expect(data).toHaveProperty('total_groups');
    expect(data).toHaveProperty('unique_wallets');
  });

  test('stats returns account_value/roi/win_rate (nullable)', async ({ page }) => {
    const r = await api(page, '/api/v1/trader-groups/group-1/stats?period=30D');
    const data = r.body?.data ?? r.body;
    expect(data).toHaveProperty('account_value');
    expect(data).toHaveProperty('roi');
    expect(data).toHaveProperty('win_rate');
  });

  test('positions returns positions array with totals', async ({ page }) => {
    const r = await api(page, '/api/v1/trader-groups/group-1/positions');
    const data = r.body?.data ?? r.body;
    expect(Array.isArray(data.positions)).toBe(true);
    expect(data).toHaveProperty('totals');
  });

  test('performance returns points array', async ({ page }) => {
    const r = await api(page, '/api/v1/trader-groups/group-1/performance?period=30D');
    const data = r.body?.data ?? r.body;
    expect(Array.isArray(data.points)).toBe(true);
  });

  test('activity returns items array with sources', async ({ page }) => {
    const r = await api(page, '/api/v1/trader-groups/group-1/activity');
    const data = r.body?.data ?? r.body;
    expect(Array.isArray(data.items)).toBe(true);
    expect(data).toHaveProperty('sources');
  });

  test('alerts CRUD round-trip (create → list → delete)', async ({ page }) => {
    test.skip(!isMock, 'alerts CRUD is mock-mode only');
    const created = await api(page, '/api/v1/trader-groups/group-1/alerts', {
      method: 'POST',
      body: JSON.stringify({
        name: 'BTC exposure',
        type: 'exposure_above',
        params: { metric: 'gross', threshold_usd: 10000 },
      }),
    });
    const alertId = created.body?.data?.id ?? created.body?.id ?? 'alert-1';
    const listed = await api(page, '/api/v1/trader-groups/group-1/alerts');
    const items = listed.body?.data ?? listed.body;
    expect(Array.isArray(items)).toBe(true);
    const deleted = await api(page, `/api/v1/trader-alerts/${alertId}`, { method: 'DELETE' });
    expect([200, 204]).toContain(deleted.status);
  });

  test('compare returns groups + series + overlap', async ({ page }) => {
    const r = await api(page, '/api/v1/trader-groups/compare', {
      method: 'POST',
      body: JSON.stringify({ group_ids: ['group-1', 'group-2'], period: '30D' }),
    });
    const data = r.body?.data ?? r.body;
    expect(Array.isArray(data.groups)).toBe(true);
    expect(Array.isArray(data.series)).toBe(true);
    expect(data).toHaveProperty('overlap');
  });
});
