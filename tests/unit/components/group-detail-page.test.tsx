import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { Suspense, act } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { ApiError } from '@/infrastructure/api-client';
import GroupDetailPage from '@/app/[locale]/(protected)/groups/[groupId]/page';
import {
  getTraderGroup,
  listGroupMembers,
  removeGroupMembers,
  updateGroupMembers,
} from '@/services/traders';
import enMessages from '@/messages/en.json';

vi.mock('@/services/traders', () => ({
  getTraderGroup: vi.fn(),
  listGroupMembers: vi.fn(),
  removeGroupMembers: vi.fn(),
  updateGroupMembers: vi.fn(),
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/stores/auth', () => ({
  useAuthStore: { getState: () => ({ requireAuth: () => true }) },
}));

vi.mock('@/components/shared/auth/connect-wallet-button', () => ({
  ConnectWalletButton: () => <button type="button">Connect stub</button>,
}));

const group = { id: 'g1', user_id: 'u1', name: 'Main', description: null, member_count: 2 };
const metricsBase = {
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
  last_trade_at: null,
  data_status: 'ready',
  is_partial: false,
  metrics_as_of: null,
  calculation_version: 1,
} as const;

const members = [
  {
    group_id: 'g1',
    venue_id: null,
    venue: 'hyperliquid',
    wallet_address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    display_name: 'Smart Money',
    alias: 'whale-1',
    note: null,
    metrics: { ...metricsBase, wallet_address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
  },
  {
    group_id: 'g1',
    venue_id: null,
    venue: 'hyperliquid',
    wallet_address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    display_name: null,
    alias: null,
    note: null,
    metrics: null,
  },
];

async function renderDetail() {
  let tree!: ReturnType<typeof render>;
  await act(async () => {
    tree = render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <Suspense fallback={<div>loading</div>}>
          <GroupDetailPage params={Promise.resolve({ groupId: 'g1' })} />
        </Suspense>
      </NextIntlClientProvider>,
    );
  });
  return tree;
}

describe('GroupDetailPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(getTraderGroup).mockResolvedValue(group);
    vi.mocked(listGroupMembers).mockResolvedValue(members);
  });

  it('renders group header and member rows', async () => {
    await renderDetail();
    expect(await screen.findByRole('heading', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getByText('0xaaaa...aaaa')).toBeInTheDocument();
    expect(screen.getByText('whale-1')).toBeInTheDocument();
    expect(screen.getByText('0xbbbb...bbbb')).toBeInTheDocument();
    expect(listGroupMembers).toHaveBeenCalledWith('g1');
  });

  it('renders member metrics with dashes for missing data', async () => {
    await renderDetail();
    await screen.findByRole('heading', { name: 'Main' });
    expect(screen.getByText('+25.00%')).toBeInTheDocument();
    expect(screen.getByText('+$5.00K')).toBeInTheDocument();
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('filters members by local search', async () => {
    const user = userEvent.setup();
    await renderDetail();
    await screen.findByText('0xaaaa...aaaa');
    await user.type(screen.getByPlaceholderText('Search address or tag'), 'whale');
    expect(screen.getByText('0xaaaa...aaaa')).toBeInTheDocument();
    expect(screen.queryByText('0xbbbb...bbbb')).not.toBeInTheDocument();
  });

  it('removes a member with venue and address then refetches', async () => {
    const user = userEvent.setup();
    vi.mocked(removeGroupMembers).mockResolvedValue({ removed: 1 });
    await renderDetail();
    await screen.findByText('0xaaaa...aaaa');
    const row = screen.getByText('0xaaaa...aaaa').closest('tr') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: 'Remove member' }));
    expect(removeGroupMembers).toHaveBeenCalledWith('g1', [
      { venue: 'hyperliquid', wallet_address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
    ]);
    expect(listGroupMembers).toHaveBeenCalledTimes(2);
  });

  it('shows not found when the group is missing', async () => {
    vi.mocked(getTraderGroup).mockRejectedValue(new ApiError(404, 'COMMON-903', 'missing'));
    (listGroupMembers as Mock).mockResolvedValue([]);
    await renderDetail();
    expect(await screen.findByText('Group not found')).toBeInTheDocument();
  });

  it('shows an empty state when there are no members', async () => {
    vi.mocked(listGroupMembers).mockResolvedValue([]);
    await renderDetail();
    expect(await screen.findByText('No members yet')).toBeInTheDocument();
  });

  it('edits alias and note inline then saves', async () => {
    const user = userEvent.setup();
    vi.mocked(updateGroupMembers).mockResolvedValue({ updated: 1 });
    await renderDetail();
    await screen.findByText('0xaaaa...aaaa');
    await user.click(
      screen.getByRole('button', {
        name: 'Edit member 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      }),
    );
    const aliasInput = screen.getByLabelText(
      'Alias 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    ) as HTMLInputElement;
    expect(aliasInput).toHaveValue('whale-1');
    await user.clear(aliasInput);
    await user.type(aliasInput, 'whale-2');
    await user.type(
      screen.getByLabelText('Note 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
      'top trader',
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(updateGroupMembers).toHaveBeenCalledWith('g1', [
      {
        venue: 'hyperliquid',
        wallet_address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        alias: 'whale-2',
        note: 'top trader',
      },
    ]);
    expect(listGroupMembers).toHaveBeenCalledTimes(2);
  });

  it('cancels editing with Escape without saving', async () => {
    const user = userEvent.setup();
    await renderDetail();
    await screen.findByText('0xaaaa...aaaa');
    await user.click(
      screen.getByRole('button', {
        name: 'Edit member 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      }),
    );
    await user.type(
      screen.getByLabelText('Alias 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
      '-edited',
    );
    await user.keyboard('{Escape}');
    expect(screen.getByText('whale-1')).toBeInTheDocument();
    expect(updateGroupMembers).not.toHaveBeenCalled();
  });

  it('surfaces member update errors', async () => {
    const user = userEvent.setup();
    vi.mocked(updateGroupMembers).mockRejectedValue(new Error('boom'));
    await renderDetail();
    await screen.findByText('0xaaaa...aaaa');
    await user.click(
      screen.getByRole('button', {
        name: 'Edit member 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('boom')).toBeInTheDocument();
  });
});
