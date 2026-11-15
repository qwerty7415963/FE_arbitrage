import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/messages/en.json';
import { BucketPositioningChart } from '@/app/[locale]/(protected)/traders/overview/[kind]/[bucket]/_components/bucket-positioning-chart';
import type { BucketDetail } from '@/types/trader';

const LONG_VALUES = [0.4, 0.42, 0.45, 0.48, 0.5, 0.52, 0.55, 0.58, 0.59, 0.6];

function makeDetail(longPct = 0.6): BucketDetail {
  return {
    as_of: '2026-01-01T00:00:00Z',
    kind: 'pnl',
    bucket_id: 'profitable',
    wallet_count: 12,
    sentiment: 'bullish',
    long_ratio: longPct,
    pnl_split: { pct_profit: 0.6, pct_loss: 0.4, usd_profit: 100, usd_loss: -40 },
    notional_split: { long_usd: 300, short_usd: 200 },
    positioning: LONG_VALUES.map((value, index) => ({
      t: `2025-10-${String(13 + index).padStart(2, '0')}`,
      long_pct: index === LONG_VALUES.length - 1 ? longPct : value,
    })),
    markets_top: [],
    coverage: { wallets_with_positions: 10, wallets_with_trades: 12 },
    markets_source: 'positions',
  };
}

function renderChart(
  props: {
    detail?: BucketDetail;
    selectedRange?: string;
    onRangeChange?: (range: string) => void;
    chartRange?: string;
  } = {},
) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <BucketPositioningChart detail={props.detail ?? makeDetail()} {...props} />
    </NextIntlClientProvider>,
  );
}

describe('BucketPositioningChart', () => {
  it('renders stacked long and short areas with boundary lines', () => {
    renderChart();

    const longArea = screen.getByTestId('positioning-long-area');
    const shortArea = screen.getByTestId('positioning-short-area');

    expect(longArea.getAttribute('class')).toContain('fill-emerald-500');
    expect(shortArea.getAttribute('class')).toContain('fill-rose-500');
    expect(longArea.getAttribute('d')).toContain('Z');
    expect(shortArea.getAttribute('d')).toContain('Z');
    expect(screen.getByTestId('positioning-long-line').getAttribute('class')).toContain(
      'stroke-emerald-500',
    );
    expect(screen.getByTestId('positioning-short-line').getAttribute('class')).toContain(
      'stroke-rose-500',
    );
  });

  it('renders the bucket title and caption row', () => {
    renderChart();

    expect(screen.getByText('Profitable Positioning')).toBeInTheDocument();
    expect(screen.getByTestId('chart-range-caption')).toHaveTextContent('30D · BULLISH');
    expect(screen.getByTestId('chart-long-caption')).toHaveTextContent('60.0% Long');
    expect(screen.getByTestId('chart-long-caption').className).toContain('text-emerald-500');
  });

  it('colours the long caption rose when below 50%', () => {
    renderChart({ detail: makeDetail(0.4) });

    expect(screen.getByTestId('chart-long-caption')).toHaveTextContent('40.0% Long');
    expect(screen.getByTestId('chart-long-caption').className).toContain('text-rose-500');
  });

  it('renders five y-axis and five x-axis labels', () => {
    renderChart();

    const yLabels = screen.getAllByTestId('y-axis-label').map((node) => node.textContent);
    expect(yLabels).toEqual(['100%', '75%', '50%', '25%', '0%']);

    const xLabels = screen.getAllByTestId('x-axis-label').map((node) => node.textContent);
    expect(xLabels).toHaveLength(5);
    expect(xLabels[0]).toBe('Oct 13');
    expect(xLabels[4]).toBe('Oct 22');
  });

  it('shows a tooltip with long and short percentages on hover', () => {
    renderChart();

    fireEvent.mouseEnter(screen.getByRole('button', { name: /Oct 13/ }));

    const tooltip = screen.getByTestId('positioning-tooltip');
    expect(tooltip).toHaveTextContent('Oct 13');
    expect(tooltip).toHaveTextContent('Long 40.0%');
    expect(tooltip).toHaveTextContent('Short 60.0%');
  });

  it('keeps the range selector in the chart header and updates internally', () => {
    const onRangeChange = vi.fn();
    renderChart({ onRangeChange });

    expect(screen.getByRole('group', { name: 'Range' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '7D' }));
    expect(screen.getByTestId('chart-range-caption')).toHaveTextContent('7D · BULLISH');
    expect(onRangeChange).not.toHaveBeenCalled();
  });

  it('reflects the selected range in the caption', () => {
    renderChart({ selectedRange: '7D' });

    expect(screen.getByTestId('chart-range-caption')).toHaveTextContent('7D · BULLISH');
  });

  it('slices positioning for 7D range', () => {
    renderChart();
    fireEvent.click(screen.getByRole('button', { name: '7D' }));

    const xLabels = screen.getAllByTestId('x-axis-label').map((node) => node.textContent);
    expect(xLabels[0]).toBe('Oct 16');
    expect(xLabels[xLabels.length - 1]).toBe('Oct 22');
  });

  it('slices positioning for 24H range with fallback', () => {
    renderChart();
    fireEvent.click(screen.getByRole('button', { name: '24H' }));

    const xLabels = screen.getAllByTestId('x-axis-label').map((node) => node.textContent);
    expect(xLabels).toHaveLength(2);
    expect(xLabels[0]).toBe('Oct 21');
    expect(xLabels[1]).toBe('Oct 22');
  });

  it('treats null long_pct as 0.5', () => {
    const detail = makeDetail();
    detail.positioning = [{ t: '2025-10-13', long_pct: null as unknown as number }];
    renderChart({ detail });

    const yLabels = screen.getAllByTestId('y-axis-label');
    expect(yLabels).toHaveLength(5);
  });

  it('shows a dashed empty state when there are no points', () => {
    renderChart({ detail: { ...makeDetail(), positioning: [] } });

    expect(screen.getByText('No positioning data')).toBeInTheDocument();
    expect(screen.queryByTestId('positioning-chart-svg')).not.toBeInTheDocument();
    expect(screen.getByTestId('chart-range-caption')).toHaveTextContent('30D · BULLISH');
  });
});
