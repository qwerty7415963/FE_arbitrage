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

test.describe('Groups', () => {
  test('renders groups page title', async ({ page }) => {
    await page.goto('/en/groups');
    await expect(page.getByRole('heading', { name: 'Groups' })).toBeVisible();
  });

  test('renders create button', async ({ page }) => {
    await page.goto('/en/groups');
    await expect(page.getByRole('button', { name: 'Create' }).first()).toBeVisible();
  });

  test('shows empty state when no groups', async ({ page }) => {
    await page.route('**/api/v1/trader-groups', (route) =>
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
    await seedAuth(page);
    await page.route('**/api/v1/trader-groups', (route) =>
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
    await page.route('**/api/v1/trader-groups', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'g1',
              user_id: 'u1',
              name: 'Main',
              description: 'desc',
              member_count: 2,
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
    await page.route('**/api/v1/trader-groups', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: { code: 'INTERNAL', message: 'boom' } }),
      }),
    );
    await page.goto('/en/groups');
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  });

  test('creates a group from the dialog', async ({ page }) => {
    await seedAuth(page);
    const created = {
      id: 'g2',
      user_id: 'u1',
      name: 'Alpha',
      description: 'first',
      member_count: 0,
    };
    await page.route('**/api/v1/trader-groups', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: created }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });
    await page.goto('/en/groups');
    await page.getByRole('button', { name: 'Create' }).first().click();
    await page.fill('#group-name', 'Alpha');
    await page.fill('#group-description', 'first');
    await page.getByRole('button', { name: 'Create' }).last().click();
    await expect(page.getByText('Alpha')).toBeVisible();
    await expect(page.getByText('first')).toBeVisible();
  });

  test('edits a group name', async ({ page }) => {
    await seedAuth(page);
    await page.route('**/api/v1/trader-groups', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'g1', user_id: 'u1', name: 'Main', description: null, member_count: 0 }],
        }),
      }),
    );
    await page.route('**/api/v1/trader-groups/g1', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 'g1', user_id: 'u1', name: 'Renamed', description: null, member_count: 0 },
        }),
      }),
    );
    await page.goto('/en/groups');
    await expect(page.getByText('Main')).toBeVisible();
    await page.getByRole('button', { name: 'Edit Main' }).click();
    await expect(page.getByText('Edit group')).toBeVisible();
    await page.fill('#group-name', 'Renamed');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Renamed')).toBeVisible();
  });

  test('delete confirmation states membership consequence', async ({ page }) => {
    await seedAuth(page);
    await page.route('**/api/v1/trader-groups', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'g1', user_id: 'u1', name: 'Main', description: null, member_count: 3 }],
        }),
      }),
    );
    await page.route('**/api/v1/trader-groups/g1', (route) =>
      route.fulfill({ status: 204, body: '' }),
    );
    await page.goto('/en/groups');
    await expect(page.getByText('Main')).toBeVisible();
    await page.getByRole('button', { name: 'Delete Main' }).click();
    await expect(page.getByText(/only membership is removed/)).toBeVisible();
    await page
      .locator('[data-slot="dialog-content"]')
      .getByRole('button', { name: 'Delete' })
      .click();
    await expect(page.getByText('Main')).toHaveCount(0);
  });
});

test.describe('Group Detail Membership', () => {
  const mockGroup = {
    id: 'g1',
    user_id: 'u1',
    name: 'Main',
    description: 'desc',
    member_count: 1,
  };

  const mockMember = {
    group_id: 'g1',
    venue_id: null,
    venue: 'hyperliquid',
    wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
    display_name: 'Smart Money',
    alias: 'whale-1',
    note: null,
    metrics: {
      wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
      venue: 'hyperliquid',
      venue_id: null,
      period: '30D',
      display_name: 'Smart Money',
      pnl: 100,
      realized_pnl: 100,
      roi: 12.5,
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
      last_trade_at: null,
      data_status: 'ready',
      is_partial: false,
      metrics_as_of: null,
      calculation_version: 1,
    },
  };

  async function mockDetail(page: Page, members: unknown[]) {
    await seedAuth(page);
    await page.route('**/api/v1/trader-groups/g1', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockGroup }),
      }),
    );
    await page.route('**/api/v1/trader-groups/g1/members*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: members }),
      }),
    );
  }

  test('lists member wallets automatically', async ({ page }) => {
    await mockDetail(page, [mockMember]);
    await page.goto('/en/groups/g1');
    await expect(page.getByText('0x1234...5678')).toBeVisible();
    await expect(page.getByText('+12.50%')).toBeVisible();
  });

  test('shows display name and alias', async ({ page }) => {
    await mockDetail(page, [mockMember]);
    await page.goto('/en/groups/g1');
    await expect(page.getByText('Smart Money')).toBeVisible();
    await expect(page.getByText('whale-1')).toBeVisible();
  });

  test('shows empty state when there are no members', async ({ page }) => {
    await mockDetail(page, []);
    await page.goto('/en/groups/g1');
    await expect(page.getByText('No members yet')).toBeVisible();
  });

  test('removes a member and refetches', async ({ page }) => {
    await mockDetail(page, [mockMember]);
    let deletes = 0;
    await page.route('**/api/v1/trader-groups/g1/members*', (route) => {
      if (route.request().method() === 'DELETE') {
        deletes += 1;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { removed: 1 } }),
        });
      }
      return route.fallback();
    });
    await page.goto('/en/groups/g1');
    await expect(page.getByText('0x1234...5678')).toBeVisible();
    await page.getByRole('button', { name: 'Remove member' }).click();
    await expect.poll(() => deletes).toBe(1);
  });

  test('links to global scanner', async ({ page }) => {
    await mockDetail(page, [mockMember]);
    await page.goto('/en/groups/g1');
    await expect(page.getByRole('link', { name: /Scan for more wallets/ })).toHaveAttribute(
      'href',
      /\/wallets\?group=g1/,
    );
  });

  test('edits member alias and note inline', async ({ page }) => {
    await mockDetail(page, [mockMember]);
    let patched: Record<string, unknown> | null = null;
    let gets = 0;
    await page.route('**/api/v1/trader-groups/g1/members*', (route) => {
      if (route.request().method() === 'PATCH') {
        patched = JSON.parse(route.request().postData() || '{}');
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { updated: 1 } }),
        });
      }
      gets += 1;
      return route.fallback();
    });
    await page.goto('/en/groups/g1');
    await expect(page.getByText('0x1234...5678')).toBeVisible();
    await page
      .getByRole('button', { name: 'Edit member 0x1234567890abcdef1234567890abcdef12345678' })
      .click();
    await page.getByLabel(/Alias 0x1234/).fill('whale-2');
    await page.getByLabel(/Note 0x1234/).fill('top trader');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect
      .poll(() => Promise.resolve(patched))
      .toEqual({
        members: [
          {
            venue: 'hyperliquid',
            wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
            alias: 'whale-2',
            note: 'top trader',
          },
        ],
      });
    await expect.poll(() => Promise.resolve(gets)).toBeGreaterThan(1);
  });

  test('full flow: add two members, remove one updates count', async ({ page }) => {
    await seedAuth(page);
    const first = { ...mockMember, wallet_address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' };
    const second = { ...mockMember, wallet_address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' };
    let members = [first, second];
    await page.route('**/api/v1/trader-groups/g1', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { ...mockGroup, member_count: members.length },
        }),
      }),
    );
    await page.route('**/api/v1/trader-groups/g1/members*', (route) => {
      if (route.request().method() === 'DELETE') {
        const body = JSON.parse(route.request().postData() || '{}');
        const gone = (body.members ?? []).map((m: { wallet_address: string }) => m.wallet_address);
        members = members.filter((m) => !gone.includes(m.wallet_address));
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { removed: gone.length } }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: members }),
      });
    });
    await page.goto('/en/groups/g1');
    await expect(page.getByText('0xaaaa...aaaa')).toBeVisible();
    await expect(page.getByText('0xbbbb...bbbb')).toBeVisible();
    const row = page.getByText('0xaaaa...aaaa').locator('xpath=ancestor::tr[1]');
    await row.getByRole('button', { name: 'Remove member' }).click();
    await expect(page.getByText('0xaaaa...aaaa')).not.toBeVisible();
    await expect(page.getByText('0xbbbb...bbbb')).toBeVisible();
  });
});

test.describe('Wallet Scanner', () => {
  const mockTrader = {
    wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
    venue: 'hyperliquid',
    venue_id: null,
    period: '30D',
    display_name: 'Smart Money',
    pnl: 12345.67,
    realized_pnl: 12345.67,
    roi: 12.5,
    win_rate: 66.66,
    volume: 1000000,
    trade_count: 42,
    profit_factor: 1.85,
    max_drawdown_pct: null,
    long_count: 28,
    long_wins: 20,
    short_count: 14,
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

  async function mockGroupsRoute(page: Page, groups: unknown[] = []) {
    await page.route('**/api/v1/trader-groups', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: groups }),
      }),
    );
  }

  test('renders scanner filters and scans to list', async ({ page }) => {
    await seedAuth(page);
    const bodies: Record<string, unknown>[] = [];
    await page.route('**/api/v1/traders/search', (route) => {
      bodies.push(JSON.parse(route.request().postData() || '{}'));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [mockTrader], meta: {} }),
      });
    });
    await mockGroupsRoute(page);
    await page.goto('/en/wallets');
    await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeVisible();
    expect(bodies).toHaveLength(0);
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('Smart Money')).toBeVisible();
    await expect(page.getByText('0x1234...5678')).toBeVisible();
    expect(bodies[0]).toMatchObject({
      venue: 'hyperliquid',
      period: '30D',
      sort_by: 'pnl',
      sort_direction: 'desc',
    });
  });

  test('invalid min/max blocks search without API call', async ({ page }) => {
    await seedAuth(page);
    let apiCalled = false;
    await page.route('**/api/v1/traders/search', (route) => {
      apiCalled = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });
    await mockGroupsRoute(page);
    await page.goto('/en/wallets');
    await page.getByLabel('ROI Min').fill('5');
    await page.getByLabel('ROI Max').fill('1');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('Min must be less than or equal to max')).toBeVisible();
    expect(apiCalled).toBe(false);
  });

  test('non-numeric filter blocks search without API call', async ({ page }) => {
    await seedAuth(page);
    let apiCalled = false;
    await page.route('**/api/v1/traders/search', (route) => {
      apiCalled = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });
    await mockGroupsRoute(page);
    await page.goto('/en/wallets');
    await page.getByLabel('PnL Min').fill('abc');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('Filter value must be a valid number')).toBeVisible();
    expect(apiCalled).toBe(false);
  });

  test('header click sorts desc then asc', async ({ page }) => {
    await seedAuth(page);
    const bodies: Record<string, unknown>[] = [];
    await page.route('**/api/v1/traders/search', (route) => {
      bodies.push(JSON.parse(route.request().postData() || '{}'));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [mockTrader], meta: {} }),
      });
    });
    await mockGroupsRoute(page);
    await page.goto('/en/wallets');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('Smart Money')).toBeVisible();
    expect(bodies[0]).toMatchObject({ sort_by: 'pnl', sort_direction: 'desc' });
    await page
      .getByRole('columnheader', { name: 'PnL' })
      .getByRole('button', { name: 'PnL' })
      .click();
    await expect.poll(() => bodies.length).toBe(2);
    expect(bodies[1]).toMatchObject({ sort_by: 'pnl', sort_direction: 'asc' });
  });

  test('cursor pagination appends rows without duplicates', async ({ page }) => {
    await seedAuth(page);
    const bodies: Record<string, unknown>[] = [];
    const second = { ...mockTrader, wallet_address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' };
    let calls = 0;
    await page.route('**/api/v1/traders/search', (route) => {
      bodies.push(JSON.parse(route.request().postData() || '{}'));
      calls += 1;
      const data = calls === 1 ? [mockTrader] : [mockTrader, second];
      const meta = calls === 1 ? { has_more: true, cursor: 'c1' } : { has_more: false };
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data, meta }),
      });
    });
    await mockGroupsRoute(page);
    await page.goto('/en/wallets');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('0x1234...5678')).toBeVisible();
    await page.getByRole('button', { name: 'Load more' }).click();
    await expect(page.getByText('0xbbbb...bbbb')).toBeVisible();
    expect(bodies[1]).toMatchObject({ cursor: 'c1' });
    await expect(page.getByText('0x1234...5678')).toHaveCount(1);
  });

  test('empty state offers reset filters', async ({ page }) => {
    await seedAuth(page);
    await page.route('**/api/v1/traders/search', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [], meta: {} }),
      }),
    );
    await mockGroupsRoute(page);
    await page.goto('/en/wallets');
    await page.getByLabel('ROI Min').fill('99');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('No traders found')).toBeVisible();
    await page.getByRole('button', { name: 'Reset filters' }).click();
    await expect(page.getByLabel('ROI Min')).toHaveValue('');
  });

  test('API error shows retry and recovers', async ({ page }) => {
    await seedAuth(page);
    let calls = 0;
    await page.route('**/api/v1/traders/search', (route) => {
      calls += 1;
      if (calls === 1) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: { code: 'INTERNAL', message: 'boom' } }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [mockTrader], meta: {} }),
      });
    });
    await mockGroupsRoute(page);
    await page.goto('/en/wallets');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('An error occurred, please try again')).toBeVisible();
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByText('Smart Money')).toBeVisible();
  });

  test('add to group opens modal with selected traders', async ({ page }) => {
    await seedAuth(page);
    await page.route('**/api/v1/traders/search', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [mockTrader], meta: {} }),
      }),
    );
    await mockGroupsRoute(page, [{ id: 'g1', name: 'Main', member_count: 0 }]);
    await page.route('**/api/v1/trader-groups/g1/members', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { added: 1 } }),
      }),
    );
    await page.goto('/en/wallets');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByLabel('Select 0x1234567890abcdef1234567890abcdef12345678').click();
    await page.getByRole('button', { name: 'Add to group (1)', exact: true }).click();
    await expect(page.getByText('Add wallets to group')).toBeVisible();
    await expect(page.locator('[data-slot="dialog-content"]').getByText('Main')).toBeVisible();
    await page.locator('[data-slot="dialog-content"]').getByRole('radio', { name: /Main/ }).click();
    await page
      .locator('[data-slot="dialog-content"]')
      .getByRole('button', { name: 'Add 1' })
      .click();
    await expect(page.locator('[data-slot="dialog-content"]').getByText('Added 1')).toBeVisible();
  });

  test('group filter without auth shows auth message', async ({ page }) => {
    let searchCalled = false;
    await page.route('**/api/v1/traders/search', (route) => {
      searchCalled = true;
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { code: 'AUTH-003', message: 'group filter requires authentication' },
        }),
      });
    });
    await mockGroupsRoute(page, [{ id: 'g1', name: 'Main', member_count: 0 }]);
    await page.goto('/en/wallets');
    await page.getByLabel('Group').selectOption('g1');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('Group filter requires authentication')).toBeVisible();
    expect(searchCalled).toBe(true);
  });

  test('scan works without connecting wallet', async ({ page }) => {
    await page.route('**/api/v1/traders/search', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [mockTrader], meta: {} }),
      }),
    );
    await page.route('**/api/v1/trader-groups', (route) => route.abort());
    await page.goto('/en/wallets');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('0x1234...5678')).toBeVisible();
    await expect(page.getByText('Connect your wallet to filter by group')).toBeVisible();
  });

  test('save search persists across reload and re-applies filters', async ({ page }) => {
    await page.route('**/api/v1/traders/search', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [mockTrader], meta: {} }),
      }),
    );
    await mockGroupsRoute(page);
    await page.goto('/en/wallets');
    await page.getByLabel('Period').selectOption('7D');
    await page.getByLabel('ROI Min').fill('30');
    await page.getByRole('button', { name: 'Save search' }).click();
    await page.getByLabel('Search name').fill('My 7D');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('button', { name: 'My 7D', exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: 'My 7D', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'My 7D', exact: true }).click();
    await expect(page.getByText('0x1234...5678')).toBeVisible();
    await expect(page.getByLabel('Period')).toHaveValue('7D');
    await expect(page.getByLabel('ROI Min')).toHaveValue('30');
  });

  test('URL state restores filters on refresh', async ({ page }) => {
    const bodies: Record<string, unknown>[] = [];
    await page.route('**/api/v1/traders/search', (route) => {
      bodies.push(JSON.parse(route.request().postData() || '{}'));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [mockTrader], meta: {} }),
      });
    });
    await mockGroupsRoute(page);
    await page.goto('/en/wallets?period=7D&roi_min=30&sort_by=roi');
    await expect(page.getByText('Smart Money')).toBeVisible();
    await expect(page.getByLabel('Period')).toHaveValue('7D');
    await expect(page.getByLabel('ROI Min')).toHaveValue('30');
    expect(bodies[0]).toMatchObject({ period: '7D', roi_min: 30, sort_by: 'roi' });
  });

  test('search sends venue and period params', async ({ page }) => {
    const bodies: Record<string, unknown>[] = [];
    await page.route('**/api/v1/traders/search', (route) => {
      bodies.push(JSON.parse(route.request().postData() || '{}'));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [mockTrader], meta: {} }),
      });
    });
    await mockGroupsRoute(page);
    await page.goto('/en/wallets');
    await page.getByLabel('Period').selectOption('7D');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('0x1234...5678')).toBeVisible();
    expect(bodies[0]).toMatchObject({ venue: 'hyperliquid', period: '7D' });
  });

  test('group and ROI filters combine in one request', async ({ page }) => {
    await seedAuth(page);
    const bodies: Record<string, unknown>[] = [];
    await page.route('**/api/v1/traders/search', (route) => {
      bodies.push(JSON.parse(route.request().postData() || '{}'));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [mockTrader], meta: {} }),
      });
    });
    await mockGroupsRoute(page, [{ id: 'g1', name: 'Main', member_count: 5 }]);
    await page.goto('/en/wallets');
    await page.getByLabel('Group').selectOption('g1');
    await page.getByLabel('ROI Min').fill('30');
    await page.getByLabel('PnL Min').fill('1000');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('Smart Money')).toBeVisible();
    expect(bodies[0]).toMatchObject({ group_id: 'g1', roi_min: 30, pnl_min: 1000 });
  });

  test('browser back restores the previous search', async ({ page }) => {
    await seedAuth(page);
    const bodies: Record<string, unknown>[] = [];
    await page.route('**/api/v1/traders/search', (route) => {
      bodies.push(JSON.parse(route.request().postData() || '{}'));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [mockTrader], meta: {} }),
      });
    });
    await mockGroupsRoute(page);
    await page.goto('/en/wallets');
    await page.getByLabel('ROI Min').fill('10');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('Smart Money')).toBeVisible();
    await expect(page).toHaveURL(/roi_min=10/);
    await page.getByLabel('ROI Min').fill('50');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect.poll(() => bodies.length).toBe(2);
    await expect(page).toHaveURL(/roi_min=50/);
    await page.goBack();
    await expect(page).toHaveURL(/roi_min=10/);
    await expect(page.getByLabel('ROI Min')).toHaveValue('10');
    await expect.poll(() => bodies.length).toBe(3);
    expect(bodies[2]).toMatchObject({ roi_min: 10 });
    await expect(page.getByText('Smart Money')).toBeVisible();
  });

  test('network failure keeps filters and retry recovers', async ({ page }) => {
    await seedAuth(page);
    let failFirst = true;
    await page.route('**/api/v1/traders/search', (route) => {
      if (failFirst) {
        failFirst = false;
        return route.abort('failed');
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [mockTrader], meta: {} }),
      });
    });
    await mockGroupsRoute(page);
    await page.goto('/en/wallets');
    await page.getByLabel('ROI Min').fill('10');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('An error occurred, please try again')).toBeVisible();
    await expect(page.getByLabel('ROI Min')).toHaveValue('10');
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByText('Smart Money')).toBeVisible();
  });

  test('stale rows stay inspectable', async ({ page }) => {
    await seedAuth(page);
    await page.route('**/api/v1/traders/search', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ ...mockTrader, data_status: 'stale' }],
          meta: {},
        }),
      }),
    );
    await mockGroupsRoute(page);
    await page.goto('/en/wallets');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('Smart Money')).toBeVisible();
    await expect(page.getByText('Stale')).toBeVisible();
  });
});

test.describe('Trader Detail', () => {
  const mockDetail = {
    registry: {
      wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
      venue: 'hyperliquid',
      venue_id: null,
      display_name: 'Smart Money',
      discovery_source: 'leaderboard',
      first_seen_at: '2024-01-01T00:00:00Z',
      last_seen_at: '2024-01-02T00:00:00Z',
      last_trade_at: '2024-01-02T00:00:00Z',
      leaderboard_seen_at: null,
      status: 'active',
    },
    metrics: {
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
    },
    period: '30D',
  };

  test('opens detail from row and returns with filters preserved', async ({ page }) => {
    await seedAuth(page);
    await page.route('**/api/v1/traders/search', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
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
            },
          ],
          meta: {},
        }),
      }),
    );
    await page.route('**/api/v1/traders/0x*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockDetail }),
      }),
    );
    await page.route('**/api/v1/trader-groups', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      }),
    );
    await page.goto('/en/wallets');
    await page.getByLabel('ROI Min').fill('25');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByText('Smart Money')).toBeVisible();
    await page.getByRole('button', { name: 'View detail' }).click();
    await expect(page).toHaveURL(/\/wallets\/0x1234567890abcdef1234567890abcdef12345678/);
    await expect(page.getByRole('heading', { name: 'Smart Money' })).toBeVisible();
    await expect(page.getByText('Leaderboard')).toBeVisible();
    await page.getByRole('button', { name: 'Back to scanner' }).click();
    await expect(page).toHaveURL(/\/wallets(\?|$)/);
    await expect(page).toHaveURL(/roi_min=25/);
    await expect(page.getByLabel('ROI Min')).toHaveValue('25');
    await expect(page.getByText('0x1234...5678')).toBeVisible();
  });

  test('detail period tabs refetch with the new period', async ({ page }) => {
    const periods: (string | null)[] = [];
    await page.route('**/api/v1/traders/0x*', (route) => {
      periods.push(new URL(route.request().url()).searchParams.get('period'));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockDetail }),
      });
    });
    await page.goto('/en/wallets/0x1234567890abcdef1234567890abcdef12345678');
    await expect(page.getByRole('heading', { name: 'Smart Money' })).toBeVisible();
    await page.getByRole('button', { name: '7D' }).click();
    await expect.poll(() => periods[periods.length - 1]).toBe('7D');
  });

  test('detail shows not found on 404', async ({ page }) => {
    await page.route('**/api/v1/traders/0x*', (route) =>
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { code: 'COMMON-903', message: 'trader not found' },
        }),
      }),
    );
    await page.goto('/en/wallets/0x1234567890abcdef1234567890abcdef12345678');
    await expect(page.getByText('Trader not found')).toBeVisible();
  });

  test('detail add-to-group supports inline group creation', async ({ page }) => {
    await seedAuth(page);
    await page.route('**/api/v1/traders/0x*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockDetail }),
      }),
    );
    await page.route('**/api/v1/trader-groups', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { id: 'g9', user_id: 'u1', name: 'Fresh', description: null, member_count: 0 },
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });
    await page.route('**/api/v1/trader-groups/g9/members', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { added: 1 } }),
      }),
    );
    await page.goto('/en/wallets/0x1234567890abcdef1234567890abcdef12345678');
    await expect(page.getByRole('heading', { name: 'Smart Money' })).toBeVisible();
    await page.getByRole('button', { name: 'Add to group' }).click();
    await expect(page.getByText('Add wallets to group')).toBeVisible();
    await page.getByPlaceholder('e.g. Main watchlist').fill('Fresh');
    await page
      .locator('[data-slot="dialog-content"]')
      .getByRole('button', { name: 'Create' })
      .click();
    await expect(page.locator('[data-slot="dialog-content"]').getByText('Fresh')).toBeVisible();
    await page
      .locator('[data-slot="dialog-content"]')
      .getByRole('button', { name: 'Add 1' })
      .click();
    await expect(page.locator('[data-slot="dialog-content"]').getByText('Added 1')).toBeVisible();
  });

  test('stale detail stays inspectable', async ({ page }) => {
    await page.route('**/api/v1/traders/0x*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            ...mockDetail,
            metrics: { ...mockDetail.metrics, data_status: 'stale', is_partial: true },
          },
        }),
      }),
    );
    await page.goto('/en/wallets/0x1234567890abcdef1234567890abcdef12345678');
    await expect(page.getByRole('heading', { name: 'Smart Money' })).toBeVisible();
    await expect(page.getByText(/Stale/)).toBeVisible();
    await expect(page.getByText(/Partial data/)).toBeVisible();
  });
});
