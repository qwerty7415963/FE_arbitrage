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
        <FundingTable pairs={[createPair([{ price_spread_percent: 10 }])]} />,
      );
      expect(container.textContent).toContain('10.00%');
    });

    it('formats decimal number', () => {
      const { container } = render(
        <FundingTable pairs={[createPair([{ price_spread_percent: 10.5 }])]} />,
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
      const { container } = render(
        <FundingTable pairs={[createPair([{ price_spread_percent: 0 }])]} />,
      );
      expect(container.textContent).toContain('0.00%');
    });

    it('formats negative number', () => {
      const { container } = render(
        <FundingTable pairs={[createPair([{ price_spread_percent: -5.3 }])]} />,
      );
      expect(container.textContent).toContain('-5.30%');
    });
  });

  describe('table headers', () => {
    it('renders all 7 column headers in order', () => {
      const { container } = render(<FundingTable pairs={[createPair()]} />);
      const headers = ['Symbol', 'Pair', 'Funding', 'Funding Spread', 'APR', 'OI', 'Price Spread'];
      const headCells = container.querySelectorAll('thead th');
      expect(headCells).toHaveLength(headers.length);
      headers.forEach((header, index) => {
        expect(headCells[index]).toHaveTextContent(header);
      });
    });
  });

  describe('symbol column', () => {
    it('renders base asset from symbol', () => {
      const { container } = render(<FundingTable pairs={[createPair([{ symbol: 'DOT-PERP' }])]} />);
      const row = container.querySelector('tbody tr');
      const symbolCell = row?.querySelectorAll('td')[0];
      expect(symbolCell).toHaveTextContent('DOT');
    });

    it('falls back to placeholder when symbol missing', () => {
      const { container } = render(<FundingTable pairs={[createPair([{ symbol: '' }])]} />);
      const row = container.querySelector('tbody tr');
      const symbolCell = row?.querySelectorAll('td')[0];
      expect(symbolCell?.textContent).toBe('—');
    });

    it('pair column shows venue names only', () => {
      const { container } = render(
        <FundingTable
          pairs={[
            createPair([
              { long_venue_id: 'v1', venue_a_symbol: 'ERA-USD', venue_b_symbol: 'ERAUSDT' },
            ]),
          ]}
        />,
      );
      const row = container.querySelector('tbody tr');
      const pairCell = row?.querySelectorAll('td')[1];
      expect(pairCell).toHaveTextContent('LONG');
      expect(pairCell).toHaveTextContent('Binance');
      expect(pairCell).toHaveTextContent('SHORT');
      expect(pairCell).toHaveTextContent('OKX');
    });
  });

  describe('Funding Spread color logic', () => {
    it('positive spread shows primary color', () => {
      const { container } = render(
        <FundingTable pairs={[createPair([{ rate_1h_percent: 10.5 }])]} />,
      );
      const row = container.querySelector('tbody tr');
      const cell = row?.querySelectorAll('td')[3];
      expect(cell?.className).toContain('text-primary');
    });

    it('negative spread shows destructive color', () => {
      const { container } = render(
        <FundingTable pairs={[createPair([{ rate_1h_percent: -5.3 }])]} />,
      );
      const row = container.querySelector('tbody tr');
      const cell = row?.querySelectorAll('td')[3];
      expect(cell?.className).toContain('text-destructive');
    });

    it('zero spread shows destructive color', () => {
      const { container } = render(<FundingTable pairs={[createPair([{ rate_1h_percent: 0 }])]} />);
      const row = container.querySelector('tbody tr');
      const cell = row?.querySelectorAll('td')[3];
      expect(cell?.className).toContain('text-destructive');
    });
  });

  describe('long-first ordering', () => {
    it('shows long venue funding and OI first when venue A is long', () => {
      const { container } = render(
        <FundingTable
          pairs={[
            createPair([
              {
                long_venue_id: 'v1',
                venue_a_funding_rate: '0.00012',
                venue_b_funding_rate: '-0.00003',
                venue_a_oi: '1000000',
                venue_b_oi: '500000',
              },
            ]),
          ]}
        />,
      );
      const row = container.querySelector('tbody tr');
      const fundingLines = row?.querySelectorAll('td')[2].querySelectorAll('div');
      expect(fundingLines).toHaveLength(2);
      expect(fundingLines?.[0]).toHaveTextContent('0.0120%');
      expect(fundingLines?.[1]).toHaveTextContent('-0.0030%');
      const oiLines = row?.querySelectorAll('td')[5].querySelectorAll('div');
      expect(oiLines).toHaveLength(2);
      expect(oiLines?.[0]).toHaveTextContent('$1.0M');
      expect(oiLines?.[1]).toHaveTextContent('$500.0K');
    });

    it('shows long venue funding and OI first when venue B is long', () => {
      const { container } = render(
        <FundingTable
          pairs={[
            createPair([
              {
                long_venue_id: 'v2',
                venue_a_funding_rate: '0.00012',
                venue_b_funding_rate: '-0.00003',
                venue_a_oi: '1000000',
                venue_b_oi: '500000',
              },
            ]),
          ]}
        />,
      );
      const row = container.querySelector('tbody tr');
      const fundingLines = row?.querySelectorAll('td')[2].querySelectorAll('div');
      expect(fundingLines).toHaveLength(2);
      expect(fundingLines?.[0]).toHaveTextContent('-0.0030%');
      expect(fundingLines?.[1]).toHaveTextContent('0.0120%');
      const oiLines = row?.querySelectorAll('td')[5].querySelectorAll('div');
      expect(oiLines).toHaveLength(2);
      expect(oiLines?.[0]).toHaveTextContent('$500.0K');
      expect(oiLines?.[1]).toHaveTextContent('$1.0M');
    });
  });

  describe('funding rates monospace', () => {
    it('renders funding rate with font-mono class', () => {
      const { container } = render(<FundingTable pairs={[createPair()]} />);
      const monoCells = container.querySelectorAll('.font-mono');
      expect(monoCells.length).toBeGreaterThan(0);
    });
  });

  describe('merged cells', () => {
    it('renders merged cells inline', () => {
      const pairs = [
        createPair([{ venue_a_funding_rate: '-0.0036', venue_b_funding_rate: '-0.0009' }]),
      ];
      pairs[0].venue_a = { id: 'v1', code: 'BINANCE', name: 'Binance' };
      pairs[0].venue_b = { id: 'v2', code: 'EXTENDED', name: 'Extended' };
      render(<FundingTable pairs={pairs} />);
      expect(screen.getByText('Binance')).toBeInTheDocument();
      expect(screen.getByText('Extended')).toBeInTheDocument();
    });
  });

  describe('row uniqueness', () => {
    it('renders rows with unique content per token', () => {
      const pairs = [
        createPair([
          {
            symbol: 'BTC-USDT',
            instrument_id: 'btc-usdt',
            venue_a_symbol: 'BTC-USDT',
            venue_b_symbol: 'BTC-USDT',
          },
          {
            symbol: 'ETH-USDT',
            instrument_id: 'eth-usdt',
            venue_a_symbol: 'ETH-USDT',
            venue_b_symbol: 'ETH-USDT',
          },
        ]),
      ];
      render(<FundingTable pairs={pairs} />);
      expect(screen.getAllByText('BTC-USDT').length).toBeGreaterThan(0);
      expect(screen.getAllByText('ETH-USDT').length).toBeGreaterThan(0);
    });
  });
});
