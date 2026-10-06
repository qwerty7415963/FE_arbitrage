import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { FilterChips } from '@/app/[locale]/(protected)/traders/_components/filter-chips';
import ScannerPage from '@/app/[locale]/(protected)/traders/page';
import { useAuthStore } from '@/lib/stores/auth';
import { listTraderGroups, searchTraders } from '@/services/traders';
import { defaultDraft, type FilterDraft } from '@/lib/trader-filter-draft';
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

function makeRow(address: string): PeriodMetrics {
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
  };
}

const ROW_A = makeRow('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');

function renderChips(draft: FilterDraft, onRemove = vi.fn(), disabled = false) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <FilterChips draft={draft} onRemove={onRemove} disabled={disabled} />
    </NextIntlClientProvider>,
  );
}

function renderPage() {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <ScannerPage />
    </NextIntlClientProvider>,
  );
}

describe('FilterChips', () => {
  beforeEach(() => {
    nav.params = new URLSearchParams();
    window.localStorage.clear();
    window.sessionStorage.clear();
    useAuthStore.setState({ isAuthenticated: false });
    vi.mocked(listTraderGroups).mockResolvedValue([]);
    vi.mocked(searchTraders).mockResolvedValue({ data: [ROW_A], meta: {} });
  });

  it('renders one short key-value chip per active metric filter', () => {
    const draft = defaultDraft();
    draft.ranges.roi = { min: '20', max: '' };
    draft.ranges.pnl = { min: '', max: '500' };
    renderChips(draft);

    expect(screen.getByText('ROI \u226520%')).toBeInTheDocument();
    expect(screen.getByText('PnL \u2264$500')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove ROI \u226520%' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove PnL \u2264$500' })).toBeInTheDocument();
  });

  it('renders nothing when no metric filter is active', () => {
    renderChips(defaultDraft());
    expect(screen.queryByTestId('filter-chips')).not.toBeInTheDocument();
  });

  it('collapses more than four chips into a +N chip', () => {
    const draft = defaultDraft();
    draft.ranges.roi = { min: '1', max: '' };
    draft.ranges.winRate = { min: '2', max: '' };
    draft.ranges.pnl = { min: '3', max: '' };
    draft.ranges.volume = { min: '4', max: '' };
    draft.ranges.tradeCount = { min: '5', max: '' };
    draft.ranges.profitFactor = { min: '6', max: '' };
    renderChips(draft);

    expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(4);
    expect(screen.getByTestId('filter-chips-overflow')).toHaveTextContent('+2');
  });

  it('removes exactly the clicked filter', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const draft = defaultDraft();
    draft.ranges.roi = { min: '20', max: '' };
    renderChips(draft, onRemove);

    await user.click(screen.getByRole('button', { name: 'Remove ROI \u226520%' }));
    expect(onRemove).toHaveBeenCalledWith('roi');
  });

  it('re-runs the search when a chip is removed', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await user.type(screen.getByLabelText('ROI from (%)'), '30');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    await screen.findByText('0xaaaa...aaaa');
    expect(screen.getByText('ROI \u226530%')).toBeInTheDocument();

    vi.mocked(searchTraders).mockClear();
    await user.click(screen.getByRole('button', { name: 'Remove ROI \u226530%' }));

    expect(searchTraders).toHaveBeenCalledTimes(1);
    const lastQuery = vi.mocked(searchTraders).mock.lastCall?.[0];
    expect(lastQuery?.roi).toBeUndefined();
    expect(lastQuery?.period).toBe('30D');
    expect(screen.queryByText('ROI \u226530%')).not.toBeInTheDocument();
  });

  it('sheet reset clears only the nine metrics, keeps the period and re-runs', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      within(screen.getByRole('group', { name: 'Period' })).getByRole('button', { name: '7D' }),
    );
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await user.type(screen.getByLabelText('ROI from (%)'), '30');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    await screen.findByText('0xaaaa...aaaa');

    vi.mocked(searchTraders).mockClear();
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    const lastQuery = vi.mocked(searchTraders).mock.lastCall?.[0];
    expect(lastQuery?.roi).toBeUndefined();
    expect(lastQuery?.period).toBe('7D');
    expect(lastQuery?.venue).toBe('hyperliquid');
    expect(screen.queryByText('ROI \u226530%')).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('group', { name: 'Period' })).getByRole('button', { name: '7D' }),
    ).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(screen.getByLabelText('ROI from (%)')).toHaveValue('');
  });
});
