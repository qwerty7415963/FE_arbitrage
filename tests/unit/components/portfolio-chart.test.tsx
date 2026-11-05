import type { ComponentProps } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { PortfolioChart } from '@/app/[locale]/(protected)/traders/[address]/_components/portfolio-chart';
import type { PortfolioRange, PortfolioRangeSeries } from '@/types/trader';
import enMessages from '@/messages/en.json';

const series: Partial<Record<PortfolioRange, PortfolioRangeSeries>> = {
  '24H': {
    account_value: [
      { time: '2026-11-04T08:20:00Z', value: 78620.34 },
      { time: '2026-11-04T01:00:00Z', value: 78000 },
    ],
    pnl: [
      { time: '2026-11-04T08:20:00Z', value: 120 },
      { time: '2026-11-04T01:00:00Z', value: 20 },
    ],
  },
  '7D': {
    account_value: [
      { time: '2026-10-29T00:00:00Z', value: 75000 },
      { time: '2026-11-04T08:20:00Z', value: 79000 },
    ],
    pnl: [
      { time: '2026-10-29T00:00:00Z', value: -100 },
      { time: '2026-11-04T08:20:00Z', value: 180 },
    ],
  },
  '30D': {
    account_value: [
      { time: '2026-10-06T00:00:00Z', value: 64000 },
      { time: '2026-11-04T08:20:00Z', value: 80000 },
    ],
    pnl: [
      { time: '2026-10-06T00:00:00Z', value: -400 },
      { time: '2026-11-04T08:20:00Z', value: 220 },
    ],
  },
  ALL: {
    account_value: [
      { time: '2026-09-01T00:00:00Z', value: 50000 },
      { time: '2026-11-04T08:20:00Z', value: 81000 },
    ],
    pnl: [
      { time: '2026-11-04T08:20:00Z', value: 250 },
      { time: '2026-09-01T00:00:00Z', value: 50 },
    ],
  },
};

function renderChart(props: Partial<ComponentProps<typeof PortfolioChart>> = {}) {
  const onModeChange = vi.fn();
  const view = render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <PortfolioChart series={series} mode="perps" onModeChange={onModeChange} {...props} />
    </NextIntlClientProvider>,
  );
  return { ...view, onModeChange };
}

describe('PortfolioChart', () => {
  it('renders the ALL title and the last pnl point by default', () => {
    renderChart();
    expect(screen.getByText('ALL PERPS PNL')).toBeInTheDocument();
    expect(screen.getByText('+$250')).toBeInTheDocument();
    for (const range of ['24H', '7D', '30D', 'ALL']) {
      expect(screen.getByRole('button', { name: range })).toBeInTheDocument();
    }
  });

  it('changes the range and value locally without a callback', () => {
    const { onModeChange } = renderChart();
    fireEvent.click(screen.getByRole('button', { name: '24H' }));
    expect(screen.getByText('24H PERPS PNL')).toBeInTheDocument();
    expect(screen.getByText('+$120')).toBeInTheDocument();
    expect(onModeChange).not.toHaveBeenCalled();
  });

  it('renders the account value series after switching the metric', () => {
    renderChart();
    fireEvent.click(screen.getByRole('button', { name: 'VALUE' }));
    expect(screen.getByText('ALL PERPS VALUE')).toBeInTheDocument();
    expect(screen.getByText('$81.00K')).toBeInTheDocument();
  });

  it('shows the no-data copy when the selected series is empty', () => {
    renderChart({ series: { ALL: { account_value: [], pnl: [] } } });
    expect(screen.getByText('ALL PERPS PNL')).toBeInTheDocument();
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('calls onModeChange from the mode buttons', () => {
    const { onModeChange } = renderChart();
    fireEvent.click(screen.getByRole('button', { name: 'COMBINED' }));
    expect(onModeChange).toHaveBeenCalledWith('combined');
    fireEvent.click(screen.getByRole('button', { name: 'PERPS' }));
    expect(onModeChange).toHaveBeenCalledWith('perps');
  });

  it('renders a status skeleton while loading', () => {
    renderChart({ isLoading: true });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
