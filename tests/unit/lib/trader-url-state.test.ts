import { describe, it, expect } from 'vitest';
import { buildTraderSearchParams, parseTraderSearchParams } from '@/lib/trader-url-state';
import type { TraderSearchQuery } from '@/types/trader';

describe('trader-url-state', () => {
  it('serializes a full query to params', () => {
    const params = buildTraderSearchParams({
      venue: 'hyperliquid',
      period: '7D',
      roi: { min: 30 },
      winRate: { min: 60, max: 100 },
      tradeCount: { min: 10 },
      sortBy: 'roi',
      sortDirection: 'asc',
      limit: 20,
      cursor: 'opaque-cursor',
      groupId: 'g1',
      lastTradeAfter: '2026-09-01T00:00:00Z',
    });
    expect(params.get('venue')).toBe('hyperliquid');
    expect(params.get('period')).toBe('7D');
    expect(params.get('roi_min')).toBe('30');
    expect(params.get('win_rate_min')).toBe('60');
    expect(params.get('win_rate_max')).toBe('100');
    expect(params.get('trade_count_min')).toBe('10');
    expect(params.get('sort_by')).toBe('roi');
    expect(params.get('sort_direction')).toBe('asc');
    expect(params.get('limit')).toBe('20');
    expect(params.get('cursor')).toBe('opaque-cursor');
    expect(params.get('group_id')).toBe('g1');
    expect(params.get('last_trade_after')).toBe('2026-09-01T00:00:00Z');
    expect(params.get('pnl_min')).toBeNull();
  });

  it('round-trips a query', () => {
    const query: TraderSearchQuery = {
      period: '30D',
      pnl: { min: -100, max: 5000 },
      profitFactor: { min: 1.5 },
      longWinRate: { max: 90 },
      shortWinRate: { min: 10, max: 80 },
      sortBy: 'last_trade',
      sortDirection: 'desc',
      limit: 20,
    };
    expect(parseTraderSearchParams(buildTraderSearchParams(query))).toEqual(query);
  });

  it('drops invalid values when parsing', () => {
    const parsed = parseTraderSearchParams(
      new URLSearchParams(
        'roi_min=abc&period=90D&sort_by=nope&sort_direction=up&limit=many&venue=++&cursor=',
      ),
    );
    expect(parsed).toEqual({});
  });

  it('parses partial ranges', () => {
    expect(parseTraderSearchParams(new URLSearchParams('volume_max=1000000'))).toEqual({
      volume: { max: 1000000 },
    });
  });
});
