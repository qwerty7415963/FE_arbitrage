import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/messages/en.json';
import { OverviewTab } from '@/app/[locale]/(protected)/traders/overview/_components/overview-tab';
import { OverviewCard } from '@/app/[locale]/(protected)/traders/overview/_components/overview-card';
import { OverviewSparkline } from '@/app/[locale]/(protected)/traders/overview/_components/overview-sparkline';
import type { OverviewAccountBucket, TraderOverview } from '@/types/trader';

vi.mock('@/services/traders', () => ({
  fetchTraderOverview: vi.fn(),
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href }: { children: unknown; href: string }) => (
    <a href={href}>{children as never}</a>
  ),
  useRouter: () => ({ push: vi.fn() }),
}));

const data: TraderOverview = {
  as_of: '2026-01-01T00:00:00Z',
  venue: 'hyperliquid',
  period: '30D',
  pnl_metric: 'realized_pnl',
  universe_size: 100,
  pnl_buckets: [
    {
      id: 'extremely_profitable',
      min_pnl: 1000000,
      max_pnl: null,
      wallet_count: 5,
      pnl_total: 2000000,
      volume_total: 10000000,
      long_count: 3,
      short_count: 2,
      long_ratio: 0.6,
      long_notional: 6000000,
      short_notional: 4000000,
      sentiment: 'very_bullish',
      series: [{ t: '2026-01-01', v: 10 }],
    },
    {
      id: 'very_profitable',
      min_pnl: 100000,
      max_pnl: 1000000,
      wallet_count: 10,
      pnl_total: 500000,
      volume_total: 5000000,
      long_count: 6,
      short_count: 4,
      long_ratio: 0.6,
      long_notional: 3000000,
      short_notional: 2000000,
      sentiment: 'bullish',
      series: [],
    },
    {
      id: 'profitable',
      min_pnl: 0,
      max_pnl: 100000,
      wallet_count: 20,
      pnl_total: 50000,
      volume_total: 2000000,
      long_count: 10,
      short_count: 10,
      long_ratio: 0.5,
      long_notional: 1000000,
      short_notional: 1000000,
      sentiment: 'slightly_bullish',
      series: [{ t: '2026-01-01', v: 5 }],
    },
    {
      id: 'unprofitable',
      min_pnl: -100000,
      max_pnl: 0,
      wallet_count: 15,
      pnl_total: -20000,
      volume_total: 1500000,
      long_count: 7,
      short_count: 8,
      long_ratio: 0.47,
      long_notional: 700000,
      short_notional: 800000,
      sentiment: 'slightly_bearish',
      series: [],
    },
    {
      id: 'very_unprofitable',
      min_pnl: -1000000,
      max_pnl: -100000,
      wallet_count: 8,
      pnl_total: -500000,
      volume_total: 800000,
      long_count: 3,
      short_count: 5,
      long_ratio: 0.375,
      long_notional: 300000,
      short_notional: 500000,
      sentiment: 'bearish',
      series: [],
    },
    {
      id: 'rekt',
      min_pnl: null,
      max_pnl: -1000000,
      wallet_count: 2,
      pnl_total: -2000000,
      volume_total: 200000,
      long_count: 1,
      short_count: 1,
      long_ratio: 0.5,
      long_notional: 100000,
      short_notional: 100000,
      sentiment: 'very_bearish',
      series: [],
    },
  ],
  account_buckets: [
    {
      id: 'apex',
      min_equity: 5000000,
      max_equity: null,
      wallet_count: 1,
      equity_total: 6000000,
      volume_total: 12000000,
      long_count: 1,
      short_count: 0,
      long_ratio: 1,
      long_notional: 12000000,
      short_notional: 0,
      sentiment: 'very_bullish',
      series: [{ t: '2026-01-01', v: 6000000 }],
    },
    {
      id: 'whale',
      min_equity: 1000000,
      max_equity: 5000000,
      wallet_count: 4,
      equity_total: 8000000,
      volume_total: 16000000,
      long_count: 2,
      short_count: 2,
      long_ratio: 0.5,
      long_notional: 8000000,
      short_notional: 8000000,
      sentiment: 'neutral',
      series: [],
    },
    {
      id: 'large',
      min_equity: 100000,
      max_equity: 1000000,
      wallet_count: 10,
      equity_total: 5000000,
      volume_total: 10000000,
      long_count: 5,
      short_count: 5,
      long_ratio: 0.5,
      long_notional: 5000000,
      short_notional: 5000000,
      sentiment: 'neutral',
      series: [],
    },
    {
      id: 'medium',
      min_equity: 10000,
      max_equity: 100000,
      wallet_count: 20,
      equity_total: 1000000,
      volume_total: 2000000,
      long_count: 10,
      short_count: 10,
      long_ratio: 0.5,
      long_notional: 1000000,
      short_notional: 1000000,
      sentiment: 'neutral',
      series: [],
    },
    {
      id: 'small',
      min_equity: 0,
      max_equity: 10000,
      wallet_count: 30,
      equity_total: 100000,
      volume_total: 200000,
      long_count: 15,
      short_count: 15,
      long_ratio: 0.5,
      long_notional: 100000,
      short_notional: 100000,
      sentiment: 'neutral',
      series: [],
    },
  ],
  coverage: {
    pnl_wallets: 60,
    account_value_wallets: 65,
    series_wallets: 40,
    data_status: { ready: 55, stale: 3, error: 1, syncing: 1 },
  },
};

function renderOverview(props: Record<string, unknown> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <OverviewTab data={data} isLoading={false} isError={false} {...props} />
    </NextIntlClientProvider>,
  );
}

describe('TraderOverview', () => {
  it('renders header and both sections', () => {
    renderOverview();
    expect(screen.getByText('Trader Overview')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('Account Size')).toBeInTheDocument();
  });

  it('renders all 11 buckets', () => {
    renderOverview();
    const badges = screen.getAllByTestId('sentiment-badge');
    expect(badges.length).toBe(11);
  });

  it('shows sentiment text and color', () => {
    renderOverview();
    expect(screen.getAllByText('Very bullish').length).toBeGreaterThan(0);
    const badge = screen.getAllByTestId('sentiment-badge')[0];
    expect(badge.className).toContain('financial-positive');
  });

  it('shows long/short approx marker', () => {
    renderOverview();
    expect(screen.getAllByText(/LONG ≈/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/SHORT ≈/).length).toBeGreaterThan(0);
  });

  it('handles empty series without crash', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <OverviewSparkline series={[]} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByTestId('overview-sparkline')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <OverviewTab isLoading={true} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state with retry', () => {
    const onRetry = vi.fn();
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <OverviewTab isError={true} onRetry={onRetry} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('Failed to load overview')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <OverviewTab
          data={{ ...data, pnl_buckets: [], account_buckets: [] }}
          isLoading={false}
          isError={false}
        />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('No overview data available')).toBeInTheDocument();
  });

  it('shows no-pnl-wallets message when pnl_buckets empty but account section renders', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <OverviewTab data={{ ...data, pnl_buckets: [] }} isLoading={false} isError={false} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('No wallets with non-zero PnL in this period')).toBeInTheDocument();
    expect(screen.getByText('Account Size')).toBeInTheDocument();
  });

  it('renders coverage footer', () => {
    renderOverview();
    expect(screen.getByText(/Coverage/)).toBeInTheDocument();
    expect(screen.getByText(/PnL wallets/)).toBeInTheDocument();
  });

  it('renders card directly', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <OverviewCard
          icon={undefined}
          title="Test"
          subtitle=">= $1M"
          sentiment="neutral"
          walletCount={5}
          series={[]}
          longNotional={100}
          shortNotional={50}
          longRatio={0.67}
        />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText(/LONG ≈/)).toBeInTheDocument();
    expect(screen.getByTestId('split-bar')).toBeInTheDocument();
  });

  it('renders pnl and account buckets in canonical order', () => {
    renderOverview();
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual([
      'Extremely profitable',
      'Very profitable',
      'Profitable',
      'Unprofitable',
      'Very unprofitable',
      'Rekt',
      'Apex',
      'Whale',
      'Large',
      'Medium',
      'Small',
    ]);
  });

  it('colors bearish sentiment rose and bullish emerald', () => {
    renderOverview();
    const badges = screen.getAllByTestId('sentiment-badge');
    expect(badges[0].className).toContain('financial-positive');
    expect(badges[5].className).toContain('financial-negative');
  });

  it('handles null series and null min/max without crash', () => {
    const nullData = {
      ...data,
      pnl_buckets: data.pnl_buckets.map((b) => ({
        ...b,
        min_pnl: null,
        max_pnl: null,
        series: null,
      })),
      account_buckets: data.account_buckets.map((b) => ({
        ...b,
        min_equity: null,
        max_equity: null,
        series: null,
      })),
    };
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <OverviewTab data={nullData} isLoading={false} isError={false} />
      </NextIntlClientProvider>,
    );
    expect(screen.getAllByTestId('overview-sparkline').length).toBe(11);
  });

  it('renders card with null series', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <OverviewCard
          icon={undefined}
          title="NullSeries"
          subtitle=">= $1M"
          sentiment="neutral"
          walletCount={5}
          series={null}
          longNotional={100}
          shortNotional={50}
          longRatio={0.67}
        />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText('NullSeries')).toBeInTheDocument();
    expect(screen.getByTestId('overview-sparkline')).toBeInTheDocument();
  });

  it('renders account bucket card LONG/SHORT from new fields', () => {
    const accountBucket: OverviewAccountBucket = {
      id: 'apex',
      min_equity: 5000000,
      max_equity: null,
      wallet_count: 1,
      equity_total: 6000000,
      volume_total: 12000000,
      long_count: 1,
      short_count: 0,
      long_ratio: 1,
      long_notional: 12000000,
      short_notional: 0,
      sentiment: 'very_bullish',
      series: [],
    };
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <OverviewCard bucket={accountBucket} title="Apex" walletCount={1} series={[]} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText(/LONG ≈ \$12.00M \/ SHORT ≈ \$0.00/)).toBeInTheDocument();
    expect(screen.getByText('Very bullish')).toBeInTheDocument();
  });
});
