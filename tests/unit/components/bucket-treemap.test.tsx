import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/messages/en.json';
import { BucketTreemap } from '@/app/[locale]/(protected)/traders/overview/[kind]/[bucket]/_components/bucket-treemap';
import type { BucketDetail, BucketMarketTop } from '@/types/trader';

const MARKETS: BucketMarketTop[] = [
  {
    market: 'BTC',
    notional: 60,
    upnl: 1250,
    sentiment: 'bullish',
    traders: 3,
    asset_id: '',
    asset_category: '',
    logo_url: null,
  },
  {
    market: 'ETH',
    notional: 30,
    upnl: -500,
    sentiment: 'bearish',
    traders: 2,
    asset_id: '',
    asset_category: '',
    logo_url: null,
  },
  {
    market: 'SOL',
    notional: 10,
    upnl: 0,
    sentiment: 'neutral',
    traders: 1,
    asset_id: '',
    asset_category: '',
    logo_url: null,
  },
];

function makeDetail(markets: BucketMarketTop[] = MARKETS): BucketDetail {
  return {
    as_of: '2026-01-01T00:00:00Z',
    kind: 'pnl',
    bucket_id: 'profitable',
    wallet_count: 12,
    sentiment: 'bullish',
    long_ratio: 0.6,
    pnl_split: { pct_profit: 0.6, pct_loss: 0.4, usd_profit: 100, usd_loss: -40 },
    notional_split: { long_usd: 300, short_usd: 200 },
    positioning: [],
    markets_top: markets,
    coverage: { wallets_with_positions: 10, wallets_with_trades: 12 },
    markets_source: 'positions',
  };
}

function renderTreemap(markets: BucketMarketTop[] = MARKETS) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <BucketTreemap detail={makeDetail(markets)} />
    </NextIntlClientProvider>,
  );
}

function getTile(market: string): HTMLElement {
  const tile = screen
    .getAllByTestId('treemap-tile')
    .find((node) => node.getAttribute('data-market') === market);
  if (!tile) throw new Error(`Tile not found: ${market}`);
  return tile;
}

describe('BucketTreemap', () => {
  it('renders one tile per market with symbol, badge and signed upnl', () => {
    renderTreemap();

    expect(screen.getAllByTestId('treemap-tile')).toHaveLength(3);

    const btc = getTile('BTC');
    expect(within(btc).getByText('BTC')).toBeInTheDocument();
    expect(within(btc).getByText(/\+\$1\.25K/)).toBeInTheDocument();
    expect(within(btc).getByText('UPNL')).toBeInTheDocument();
    expect(within(btc).getByText('Bullish')).toBeInTheDocument();

    expect(within(getTile('ETH')).getByText(/-\$500\.00/)).toBeInTheDocument();
    expect(within(getTile('SOL')).getByText(/\$0\.00/)).toBeInTheDocument();
  });

  it('tints tiles by upnl sign', () => {
    renderTreemap();

    expect(getTile('BTC').className).toContain('bg-financial-positive-subtle');
    expect(getTile('ETH').className).toContain('bg-financial-negative-subtle');
    expect(getTile('SOL').className).toContain('bg-muted');
  });

  it('hides the sentiment label on small tiles', () => {
    renderTreemap([
      {
        market: 'BTC',
        notional: 990,
        upnl: 10,
        sentiment: 'bullish',
        traders: 2,
        asset_id: '',
        asset_category: '',
        logo_url: null,
      },
      {
        market: 'DOGE',
        notional: 10,
        upnl: -1,
        sentiment: 'bearish',
        traders: 1,
        asset_id: '',
        asset_category: '',
        logo_url: null,
      },
    ]);

    const small = getTile('DOGE');
    expect(within(small).queryByText('Bearish')).not.toBeInTheDocument();
    expect(within(getTile('BTC')).getByText('Bullish')).toBeInTheDocument();
  });

  it('renders at most eight tiles plus other', () => {
    const markets = Array.from({ length: 13 }, (_, index) => ({
      market: `M${index}`,
      notional: 13 - index,
      upnl: index,
      sentiment: 'neutral',
      traders: 1,
      asset_id: '',
      asset_category: '',
      logo_url: null,
    }));

    renderTreemap(markets);

    expect(screen.getAllByTestId('treemap-tile')).toHaveLength(9);
  });

  it('uses Realized PnL label when markets_source is trades', () => {
    const detail = makeDetail(MARKETS);
    detail.markets_source = 'trades';
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <BucketTreemap detail={detail} />
      </NextIntlClientProvider>,
    );
    const btc = getTile('BTC');
    expect(within(btc).getByText('Realized PnL')).toBeInTheDocument();
    expect(within(btc).queryByText('UPNL')).not.toBeInTheDocument();
  });

  it('shows the empty state with no markets', () => {
    renderTreemap([]);

    expect(screen.getByText('No markets')).toBeInTheDocument();
    expect(screen.queryAllByTestId('treemap-tile')).toHaveLength(0);
  });

  it('shows the empty state when every market has zero notional', () => {
    renderTreemap([
      {
        market: 'BTC',
        notional: 0,
        upnl: 0,
        sentiment: 'neutral',
        traders: 0,
        asset_id: '',
        asset_category: '',
        logo_url: null,
      },
      {
        market: 'ETH',
        notional: 0,
        upnl: 0,
        sentiment: 'neutral',
        traders: 0,
        asset_id: '',
        asset_category: '',
        logo_url: null,
      },
    ]);

    expect(screen.getByText('No markets')).toBeInTheDocument();
  });

  it('renders the treemap card with responsive height classes', () => {
    renderTreemap();

    const card = screen.getByTestId('bucket-treemap');
    expect(card.className).toContain('h-full');
    expect(card.className).toContain('flex');
    expect(card.className).toContain('flex-col');
  });
});
