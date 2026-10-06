import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import ScannerPage from '@/app/[locale]/(protected)/traders/page';
import { listTraderGroups, searchTraders } from '@/services/traders';
import type { PeriodMetrics } from '@/types/trader';
import enMessages from '@/messages/en.json';

const nav = vi.hoisted(() => ({
  params: new URLSearchParams(),
  replace: vi.fn(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => nav.params,
  useRouter: () => ({ replace: nav.replace, push: nav.push }),
  useParams: () => ({ locale: 'en' }),
}));

vi.mock('@/services/traders', () => ({
  listTraderGroups: vi.fn(),
  searchTraders: vi.fn(),
}));

vi.mock('@/components/shared/auth/connect-wallet-button', () => ({
  ConnectWalletButton: () => <button type="button">Connect stub</button>,
}));

function makeRow(address: string, overrides: Partial<PeriodMetrics> = {}): PeriodMetrics {
  return {
    wallet_address: address,
    venue: 'hyperliquid',
    venue_id: null,
    period: '30D',
    display_name: null,
    pnl: 100,
    realized_pnl: 100,
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
    last_trade_at: null,
    data_status: 'ready',
    is_partial: false,
    metrics_as_of: null,
    calculation_version: 1,
    ...overrides,
  };
}

const ROW_A = makeRow('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
const ROW_B = makeRow('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');

function renderPage() {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <ScannerPage />
    </NextIntlClientProvider>,
  );
}

async function openFilters(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Filters' }));
}

async function applyFilters(user: ReturnType<typeof userEvent.setup>) {
  await openFilters(user);
  await user.click(screen.getByRole('button', { name: 'Apply' }));
}

describe('TradersScannerPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    nav.params = new URLSearchParams();
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.mocked(listTraderGroups).mockResolvedValue([]);
    vi.mocked(searchTraders).mockResolvedValue({ data: [ROW_A], meta: {} });
  });

  it('searches on mount with defaults', async () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Trader Scanner' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('group', { name: 'Period' })).getByRole('button', {
        name: '30D',
      }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(await screen.findByText('0xaaaa...aaaa')).toBeInTheDocument();
    expect(searchTraders).toHaveBeenCalledTimes(1);
    expect(searchTraders).toHaveBeenCalledWith(
      expect.objectContaining({
        venue: 'hyperliquid',
        period: '30D',
        sortBy: 'pnl',
        sortDirection: 'desc',
        limit: 20,
      }),
      expect.anything(),
    );
  });

  it('does not fetch groups', async () => {
    renderPage();
    expect(await screen.findByText('0xaaaa...aaaa')).toBeInTheDocument();
    expect(listTraderGroups).not.toHaveBeenCalled();
  });

  it('searches with merged defaults and syncs the URL', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('0xaaaa...aaaa');
    await openFilters(user);
    await user.type(screen.getByLabelText('ROI from (%)'), '30');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(searchTraders).toHaveBeenLastCalledWith(
      expect.objectContaining({
        venue: 'hyperliquid',
        period: '30D',
        roi: { min: 30 },
        sortBy: 'pnl',
        sortDirection: 'desc',
        limit: 20,
      }),
      expect.anything(),
    );
    expect(await screen.findByText('0xaaaa...aaaa')).toBeInTheDocument();
    expect(screen.getByText('1 results')).toBeInTheDocument();
    expect(nav.push).toHaveBeenCalledWith(expect.stringContaining('roi_min=30'), expect.anything());
    expect(window.sessionStorage.getItem('trader.last-scan.v1')).toContain('roi_min=30');
  });

  it('shows a skeleton on first search', async () => {
    let resolveSearch: ((v: { data: PeriodMetrics[]; meta: object }) => void) | null = null;
    vi.mocked(searchTraders).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSearch = resolve;
        }),
    );
    renderPage();
    expect(await screen.findByRole('status', { name: 'Loading...' })).toBeInTheDocument();
    resolveSearch!({ data: [ROW_A], meta: {} });
    expect(await screen.findByText('0xaaaa...aaaa')).toBeInTheDocument();
  });

  it('blocks invalid filters without a second API call', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('0xaaaa...aaaa');
    await openFilters(user);
    await user.type(screen.getByLabelText('ROI from (%)'), '5');
    await user.type(screen.getByLabelText('ROI to (%)'), '1');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText('Min must be less than or equal to max')).toBeInTheDocument();
    expect(searchTraders).toHaveBeenCalledTimes(1);
  });

  it('blocks non-numeric input without a second API call', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('0xaaaa...aaaa');
    await openFilters(user);
    await user.type(screen.getByLabelText('PnL from ($)'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(await screen.findByText('Filter value must be a valid number')).toBeInTheDocument();
    expect(searchTraders).toHaveBeenCalledTimes(1);
  });

  it('toggles sort direction via header click', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('0xaaaa...aaaa');
    await applyFilters(user);
    await screen.findByText('0xaaaa...aaaa');
    const pnlHeader = screen.getByRole('columnheader', { name: 'PnL' });
    await user.click(within(pnlHeader).getByRole('button', { name: 'PnL' }));
    expect(searchTraders).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortBy: 'pnl', sortDirection: 'asc', cursor: undefined }),
      expect.anything(),
    );
  });

  it('appends deduplicated rows on load more', async () => {
    const user = userEvent.setup();
    vi.mocked(searchTraders)
      .mockResolvedValueOnce({ data: [ROW_A], meta: {} })
      .mockResolvedValueOnce({ data: [ROW_A], meta: { has_more: true, cursor: 'c1' } })
      .mockResolvedValueOnce({ data: [ROW_A, ROW_B], meta: { has_more: false } });
    renderPage();
    await screen.findByText('0xaaaa...aaaa');
    await applyFilters(user);
    await user.click(await screen.findByRole('button', { name: 'Load more' }));
    expect(searchTraders).toHaveBeenLastCalledWith(
      expect.objectContaining({ cursor: 'c1' }),
      expect.anything(),
    );
    expect(await screen.findByText('0xbbbb...bbbb')).toBeInTheDocument();
    expect(screen.getByText('2 results')).toBeInTheDocument();
  });

  it('shows error with retry and recovers', async () => {
    const user = userEvent.setup();
    vi.mocked(searchTraders)
      .mockRejectedValueOnce(new Error('boom'))
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ data: [ROW_B], meta: {} });
    renderPage();
    expect(await screen.findByText('An error occurred, please try again')).toBeInTheDocument();
    await applyFilters(user);
    expect(await screen.findByText('An error occurred, please try again')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('0xbbbb...bbbb')).toBeInTheDocument();
  });

  it('keeps old rows with progress during a new search', async () => {
    const user = userEvent.setup();
    let resolveThird: ((v: { data: PeriodMetrics[]; meta: object }) => void) | null = null;
    vi.mocked(searchTraders)
      .mockResolvedValueOnce({ data: [ROW_A], meta: {} })
      .mockResolvedValueOnce({ data: [ROW_A], meta: {} })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveThird = resolve;
          }),
      );
    renderPage();
    await screen.findByText('0xaaaa...aaaa');
    await applyFilters(user);
    await screen.findByText('0xaaaa...aaaa');
    await openFilters(user);
    await user.type(screen.getByLabelText('ROI from (%)'), '50');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.getByText('0xaaaa...aaaa')).toBeInTheDocument();
    expect(screen.getByText('Updating...')).toBeInTheDocument();
    resolveThird!({ data: [ROW_B], meta: {} });
    expect(await screen.findByText('0xbbbb...bbbb')).toBeInTheDocument();
  });

  it('lets the latest overlapping search win', async () => {
    const user = userEvent.setup();
    let resolveThird: ((v: { data: PeriodMetrics[]; meta: object }) => void) | null = null;
    vi.mocked(searchTraders)
      .mockResolvedValueOnce({ data: [ROW_A], meta: {} })
      .mockResolvedValueOnce({ data: [ROW_A], meta: {} })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveThird = resolve;
          }),
      )
      .mockResolvedValue({ data: [ROW_B], meta: {} });
    renderPage();
    await screen.findByText('0xaaaa...aaaa');
    await applyFilters(user);
    await screen.findByText('0xaaaa...aaaa');
    await openFilters(user);
    await user.type(screen.getByLabelText('ROI from (%)'), '30');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    const pnlHeader = screen.getByRole('columnheader', { name: 'PnL' });
    await user.click(within(pnlHeader).getByRole('button', { name: 'PnL' }));
    await screen.findByText('0xbbbb...bbbb');
    resolveThird!({ data: [ROW_A], meta: {} });
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByText('0xaaaa...aaaa')).not.toBeInTheDocument();
    expect(screen.getByText('0xbbbb...bbbb')).toBeInTheDocument();
  });

  it('empty-state reset re-runs the default search', async () => {
    const user = userEvent.setup();
    vi.mocked(searchTraders).mockResolvedValue({ data: [], meta: {} });
    renderPage();
    await screen.findByText('No traders found');
    await openFilters(user);
    await user.type(screen.getByLabelText('ROI from (%)'), '30');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    await screen.findByText('No traders found');
    const callsAfterApply = vi.mocked(searchTraders).mock.calls.length;
    expect(callsAfterApply).toBe(2);
    await user.click(screen.getByRole('button', { name: 'Reset filters' }));
    await screen.findByText('No traders found');
    expect(vi.mocked(searchTraders).mock.calls.length).toBe(callsAfterApply + 1);
    expect(searchTraders).toHaveBeenLastCalledWith(
      expect.objectContaining({
        venue: 'hyperliquid',
        period: '30D',
        sortBy: 'pnl',
        sortDirection: 'desc',
        limit: 20,
      }),
      expect.anything(),
    );
    await openFilters(user);
    expect(screen.getByLabelText('ROI from (%)')).toHaveValue('');
    expect(nav.push).toHaveBeenLastCalledWith('/en/traders', expect.anything());
  });

  it('restores state from URL and auto-searches', async () => {
    const user = userEvent.setup();
    nav.params = new URLSearchParams('period=7D&roi_min=30&sort_by=roi');
    renderPage();
    expect(
      within(screen.getByRole('group', { name: 'Period' })).getByRole('button', {
        name: '7D',
      }),
    ).toHaveAttribute('aria-pressed', 'true');
    await openFilters(user);
    expect(screen.getByLabelText('ROI from (%)')).toHaveValue('30');
    expect(searchTraders).toHaveBeenCalledWith(
      expect.objectContaining({ period: '7D', roi: { min: 30 }, sortBy: 'roi' }),
      expect.anything(),
    );
    expect(await screen.findByText('0xaaaa...aaaa')).toBeInTheDocument();
  });

  it('ignores ?group_id= in the URL and searches without it', async () => {
    nav.params = new URLSearchParams('group_id=g1&period=7D');
    renderPage();
    expect(await screen.findByText('0xaaaa...aaaa')).toBeInTheDocument();
    expect(searchTraders).toHaveBeenCalledWith(
      expect.not.objectContaining({ groupId: expect.anything() }),
      expect.anything(),
    );
    expect(searchTraders).toHaveBeenCalledWith(
      expect.objectContaining({ period: '7D' }),
      expect.anything(),
    );
  });

  it('hien "con nua" khi has_more bat', async () => {
    const user = userEvent.setup();
    vi.mocked(searchTraders).mockResolvedValue({
      data: [ROW_A, ROW_B],
      meta: { has_more: true, cursor: 'c1' },
    });
    renderPage();
    await screen.findByText('0xaaaa...aaaa');
    await applyFilters(user);
    expect(await screen.findByText(/more available/)).toBeInTheDocument();
    expect(screen.queryByText('2 results')).not.toBeInTheDocument();
  });

  it('giữ nhãn results thường khi has_more tắt', async () => {
    const user = userEvent.setup();
    vi.mocked(searchTraders).mockResolvedValue({ data: [ROW_A], meta: { has_more: false } });
    renderPage();
    await screen.findByText('0xaaaa...aaaa');
    await applyFilters(user);
    expect(await screen.findByText('1 results')).toBeInTheDocument();
  });
});
