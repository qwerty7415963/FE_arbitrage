import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FundingTable } from '@/app/[locale]/(public)/funding-arbitrage/funding-table';
import type { ArbitragePair } from '@/types/funding-arbitrage';

const createToken = (overrides: Record<string, unknown> = {}) => ({
  symbol: 'BTC-USDT',
  instrument_id: 'btc-usdt',
  long_venue_id: 'v1',
  short_venue_id: 'v2',
  funding_available: true,
  is_stale: false,
  rate_1h_percent: 5.2,
  rate_8h_percent: 10.5,
  apr_percent: 156.3,
  price_spread_percent: 0.01,
  venue_a_symbol: 'BTC-USDT',
  venue_a_funding_rate: '0.00012',
  venue_a_interval_seconds: 28800,
  venue_a_observed_at: '2024-01-01T00:00:00Z',
  venue_a_oi: '1000000',
  venue_b_symbol: 'BTC-USDT',
  venue_b_funding_rate: '-0.00003',
  venue_b_interval_seconds: 28800,
  venue_b_observed_at: '2024-01-01T00:00:00Z',
  venue_b_oi: '500000',
  ...overrides,
});

const createPair = (tokenOverrides: Record<string, unknown>[] = []): ArbitragePair => ({
  venue_a: { id: 'v1', code: 'BINANCE', name: 'Binance' },
  venue_b: { id: 'v2', code: 'OKX', name: 'OKX' },
  tokens: tokenOverrides.length > 0 ? tokenOverrides.map((o) => createToken(o)) : [createToken()],
});

describe('FundingTable', () => {
  describe('empty state', () => {
    it('renders empty message when pairs is empty', () => {
      render(<FundingTable pairs={[]} />);
      expect(screen.getByText('No arbitrage opportunities found')).toBeInTheDocument();
    });

    it('does not render table when empty', () => {
      const { container } = render(<FundingTable pairs={[]} />);
      expect(container.querySelector('table')).toBeNull();
    });
  });

  describe('flattenPairs', () => {
    it('single pair with 1 token renders 1 row', () => {
      const { container } = render(<FundingTable pairs={[createPair()]} />);
      const bodyRows = container.querySelectorAll('tbody tr');
      expect(bodyRows).toHaveLength(1);
    });

    it('single pair with 3 tokens renders 3 rows', () => {
      const pairs = [
        createPair([
          { symbol: 'BTC-USDT', instrument_id: 'btc-usdt' },
          { symbol: 'ETH-USDT', instrument_id: 'eth-usdt' },
          { symbol: 'SOL-USDT', instrument_id: 'sol-usdt' },
        ]),
      ];
      const { container } = render(<FundingTable pairs={pairs} />);
      const bodyRows = container.querySelectorAll('tbody tr');
      expect(bodyRows).toHaveLength(3);
    });

    it('multiple pairs render correct total rows', () => {
      const pairs = [
        createPair([{ symbol: 'BTC-USDT', instrument_id: 'btc-usdt' }]),
        createPair([{ symbol: 'ETH-USDT', instrument_id: 'eth-usdt' }]),
      ];
      pairs[0].venue_a = { id: 'v1', code: 'BINANCE', name: 'Binance' };
      pairs[0].venue_b = { id: 'v2', code: 'OKX', name: 'OKX' };
      pairs[1].venue_a = { id: 'v1', code: 'BINANCE', name: 'Binance' };
      pairs[1].venue_b = { id: 'v3', code: 'BYBIT', name: 'Bybit' };
      const { container } = render(<FundingTable pairs={pairs} />);
      const bodyRows = container.querySelectorAll('tbody tr');
      expect(bodyRows).toHaveLength(2);
    });

    it('adds venue names from pair to each row', () => {
      render(<FundingTable pairs={[createPair()]} />);
      expect(screen.getByText('Binance')).toBeInTheDocument();
      expect(screen.getByText('OKX')).toBeInTheDocument();
    });

    it('skips pair with missing tokens without crashing', () => {
      const pairs = [
        createPair(),
        {
          venue_a: { id: 'v1', code: 'BINANCE', name: 'Binance' },
          venue_b: { id: 'v3', code: 'BYBIT', name: 'Bybit' },
        },
      ];
      const { container } = render(<FundingTable pairs={pairs} />);
      expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
    });

    it('skips pair with null tokens without crashing', () => {
      const pairs = [
        {
          venue_a: { id: 'v1', code: 'BINANCE', name: 'Binance' },
          venue_b: { id: 'v2', code: 'OKX', name: 'OKX' },
          tokens: null,
        },
      ];
      render(<FundingTable pairs={pairs} />);
      expect(screen.getByText('No arbitrage opportunities found')).toBeInTheDocument();
    });

    it('renders empty state when pairs is undefined', () => {
      render(<FundingTable pairs={undefined} />);
      expect(screen.getByText('No arbitrage opportunities found')).toBeInTheDocument();
    });

    it('falls back to placeholder when venue names missing', () => {
      const pairs = [{ tokens: [createToken()] }];
      const { container } = render(<FundingTable pairs={pairs} />);
      expect(container.textContent).toContain('—');
    });
  });

  describe('formatPercent', () => {
    it('formats integer to 2 decimal places', () => {
      const { container } = render(
        <FundingTable pairs={[createPair([{ rate_8h_percent: 10 }])]} />,
      );
      expect(container.textContent).toContain('10.00%');
    });

    it('formats decimal number', () => {
      const { container } = render(
        <FundingTable pairs={[createPair([{ rate_8h_percent: 10.5 }])]} />,
      );
      expect(container.textContent).toContain('10.50%');
    });

    it('formats small number', () => {
      const { container } = render(
        <FundingTable pairs={[createPair([{ price_spread_percent: 0.01 }])]} />,
      );
      expect(container.textContent).toContain('0.01%');
    });

    it('formats zero', () => {
      const { container } = render(<FundingTable pairs={[createPair([{ rate_8h_percent: 0 }])]} />);
      expect(container.textContent).toContain('0.00%');
    });

    it('formats negative number', () => {
      const { container } = render(
        <FundingTable pairs={[createPair([{ rate_8h_percent: -5.3 }])]} />,
      );
      expect(container.textContent).toContain('-5.30%');
    });
  });

  describe('table headers', () => {
    it('renders all 10 column headers', () => {
      render(<FundingTable pairs={[createPair()]} />);
      const headers = [
        'Token',
        'Long (Venue A)',
        'Rate A',
        'Short (Venue B)',
        'Rate B',
        'Rate 8h',
        'Rate 1h',
        'APR',
        'Spread',
        'Status',
      ];
      for (const h of headers) {
        expect(screen.getByText(h)).toBeInTheDocument();
      }
    });
  });

  describe('APR color logic', () => {
    it('Rate 8h positive shows primary color', () => {
      const { container } = render(
        <FundingTable pairs={[createPair([{ rate_8h_percent: 10.5 }])]} />,
      );
      const row = container.querySelector('tbody tr');
      const cell = row?.querySelectorAll('td')[5];
      expect(cell?.className).toContain('text-primary');
    });

    it('Rate 8h negative shows destructive color', () => {
      const { container } = render(
        <FundingTable pairs={[createPair([{ rate_8h_percent: -5.3 }])]} />,
      );
      const row = container.querySelector('tbody tr');
      const cell = row?.querySelectorAll('td')[5];
      expect(cell?.className).toContain('text-destructive');
    });

    it('Rate 8h zero shows destructive color (0 is not > 0)', () => {
      const { container } = render(<FundingTable pairs={[createPair([{ rate_8h_percent: 0 }])]} />);
      const row = container.querySelector('tbody tr');
      const cell = row?.querySelectorAll('td')[5];
      expect(cell?.className).toContain('text-destructive');
    });

    it('Rate 1h positive shows primary color', () => {
      const { container } = render(
        <FundingTable pairs={[createPair([{ rate_1h_percent: 5.2 }])]} />,
      );
      const row = container.querySelector('tbody tr');
      const cell = row?.querySelectorAll('td')[6];
      expect(cell?.className).toContain('text-primary');
    });

    it('Rate 1h negative shows destructive color', () => {
      const { container } = render(
        <FundingTable pairs={[createPair([{ rate_1h_percent: -2.1 }])]} />,
      );
      const row = container.querySelector('tbody tr');
      const cell = row?.querySelectorAll('td')[6];
      expect(cell?.className).toContain('text-destructive');
    });
  });

  describe('StatusBadge', () => {
    it('shows Unavailable when funding_available is false', () => {
      render(<FundingTable pairs={[createPair([{ funding_available: false }])]} />);
      expect(screen.getByText('Unavailable')).toBeInTheDocument();
    });

    it('shows Stale when is_stale is true', () => {
      render(<FundingTable pairs={[createPair([{ funding_available: true, is_stale: true }])]} />);
      expect(screen.getByText('Stale')).toBeInTheDocument();
    });

    it('shows Live when funding_available and not stale', () => {
      render(<FundingTable pairs={[createPair([{ funding_available: true, is_stale: false }])]} />);
      expect(screen.getByText('Live')).toBeInTheDocument();
    });
  });

  describe('funding rates monospace', () => {
    it('renders funding rate with font-mono class', () => {
      const { container } = render(<FundingTable pairs={[createPair()]} />);
      const monoCells = container.querySelectorAll('.font-mono');
      expect(monoCells.length).toBeGreaterThan(0);
    });
  });

  describe('row uniqueness', () => {
    it('renders rows with unique content per token', () => {
      const pairs = [
        createPair([
          { symbol: 'BTC-USDT', instrument_id: 'btc-usdt' },
          { symbol: 'ETH-USDT', instrument_id: 'eth-usdt' },
        ]),
      ];
      render(<FundingTable pairs={pairs} />);
      expect(screen.getByText('BTC-USDT')).toBeInTheDocument();
      expect(screen.getByText('ETH-USDT')).toBeInTheDocument();
    });
  });
});
