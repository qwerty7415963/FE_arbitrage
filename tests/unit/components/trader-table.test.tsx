import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { TraderTable } from '@/components/shared/traders/trader-table';
import type { PeriodMetrics } from '@/types/trader';
import enMessages from '@/messages/en.json';

const row: PeriodMetrics = {
  wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
  venue: 'hyperliquid',
  venue_id: null,
  period: '30D',
  display_name: 'Smart Money',
  pnl: 12345.67,
  realized_pnl: 12345.67,
  roi: 12.345,
  win_rate: 66.666,
  volume: 2500000,
  trade_count: 1234,
  profit_factor: 1.857,
  max_drawdown_pct: null,
  long_count: 10,
  long_wins: 7,
  short_count: 4,
  short_wins: 1,
  gross_profit: 20000,
  gross_loss: 7654.33,
  avg_trade_pnl: 880,
  avg_holding_time_sec: 3600,
  last_trade_at: '2026-09-30T12:00:00Z',
  data_status: 'ready',
  is_partial: false,
  metrics_as_of: '2026-09-30T13:00:00Z',
  calculation_version: 1,
};

function renderTable(props: Partial<React.ComponentProps<typeof TraderTable>> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <TraderTable
        rows={[row]}
        sortBy="pnl"
        sortDirection="desc"
        onSortChange={vi.fn()}
        {...props}
      />
    </NextIntlClientProvider>,
  );
}

describe('TraderTable', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-10-01T12:00:00Z').getTime());
  });

  it('renders formatted cells with signs and tooltips', () => {
    renderTable();
    expect(screen.getByText('Smart Money')).toBeInTheDocument();
    expect(screen.getByText('0x1234...5678')).toBeInTheDocument();
    expect(screen.getByText('+$12.35K')).toBeInTheDocument();
    expect(screen.getByText('+12.35%')).toBeInTheDocument();
    expect(screen.getByText('66.67%')).toBeInTheDocument();
    expect(screen.getByText('$2.50M')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('1.86')).toBeInTheDocument();
    expect(screen.getByText('70.00% / 25.00%')).toBeInTheDocument();
    const lastTrade = screen.getByText('1d ago');
    expect(lastTrade).toBeInTheDocument();
    expect(lastTrade).toHaveAttribute('title', '2026-09-30 12:00:00 UTC');
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('renders dashes for null metrics', () => {
    renderTable({
      rows: [{ ...row, profit_factor: null, long_wins: null, short_wins: null, roi: null }],
    });
    const cells = screen.getAllByText('—');
    expect(cells.length).toBeGreaterThan(0);
    expect(screen.getByText((_, el) => el?.textContent === '— / —')).toBeInTheDocument();
  });

  it('copies the full address and shows feedback', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...globalThis.navigator, clipboard: { writeText } });
    try {
      renderTable();
      await user.click(screen.getByRole('button', { name: 'Copy address' }));
      expect(writeText).toHaveBeenCalledWith(row.wallet_address);
      expect(await screen.findByText('Copied')).toBeInTheDocument();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('sorts via header click with aria-sort state', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    renderTable({ onSortChange });
    const pnlHeader = screen.getByRole('columnheader', { name: 'PnL' });
    expect(pnlHeader).toHaveAttribute('aria-sort', 'descending');
    await user.click(within(pnlHeader).getByRole('button', { name: 'PnL' }));
    expect(onSortChange).toHaveBeenCalledWith('pnl');
    expect(screen.getByRole('columnheader', { name: 'PF' })).not.toContainHTML('button');
  });

  it('selects rows and calls view/add actions', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onView = vi.fn();
    const onAdd = vi.fn();
    renderTable({ selectable: true, selected: [], onSelect, onView, onAdd });
    await user.click(screen.getByRole('checkbox', { name: `Select ${row.wallet_address}` }));
    expect(onSelect).toHaveBeenCalledWith([row.wallet_address]);
    await user.click(screen.getByRole('button', { name: 'View detail' }));
    expect(onView).toHaveBeenCalledWith(row);
    await user.click(screen.getByRole('button', { name: 'Add to group' }));
    expect(onAdd).toHaveBeenCalledWith(row);
  });

  it('prefixes negative PnL with a minus sign instead of color only', () => {
    renderTable({ rows: [{ ...row, pnl: -2500 }] });
    expect(screen.getByText('-$2.50K')).toBeInTheDocument();
  });

  it('renders malicious display names as inert text', () => {
    const malicious = '<img src=x onerror="alert(1)">';
    renderTable({ rows: [{ ...row, display_name: malicious }] });
    expect(screen.getByText(malicious)).toBeInTheDocument();
    expect(document.querySelector('img')).not.toBeInTheDocument();
  });

  it('renders a rank column with one-based positions', () => {
    const second = { ...row, wallet_address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' };
    renderTable({ rows: [row, second] });
    const table = screen.getByRole('table');
    const bodyRows = within(table).getAllByRole('row').slice(1);
    expect(bodyRows[0]).toHaveTextContent('1');
    expect(bodyRows[1]).toHaveTextContent('2');
  });

  it('right-aligns numeric cells with tabular figures', () => {
    renderTable();
    const pnlCell = screen.getByText('+$12.35K').closest('td');
    expect(pnlCell?.className).toMatch('text-right');
    expect(pnlCell?.className).toMatch('tabular-nums');
  });

  it('right-aligns numeric headers above numeric cells', () => {
    renderTable();
    const pnlHeader = screen.getByRole('columnheader', { name: 'PnL' });
    expect(pnlHeader.className).toMatch('text-right');
    const pfHeader = screen.getByRole('columnheader', { name: 'PF' });
    expect(pfHeader.className).toMatch('text-right');
  });
});
