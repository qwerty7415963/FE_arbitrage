import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildTraderSearchParams,
  clampPage,
  parseTraderSearchParams,
  readLastScan,
  saveLastScan,
} from '@/lib/trader-url-state';
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

  it('omits page=1 for clean links and keeps page>1', () => {
    expect(buildTraderSearchParams({ page: 1 }).get('page')).toBeNull();
    expect(buildTraderSearchParams({}).get('page')).toBeNull();
    expect(buildTraderSearchParams({ page: 3 }).get('page')).toBe('3');
  });

  it('round-trips page>1', () => {
    const query: TraderSearchQuery = { period: '30D', page: 3 };
    expect(parseTraderSearchParams(buildTraderSearchParams(query))).toEqual(query);
  });

  it('clamps invalid page params to 1', () => {
    expect(parseTraderSearchParams(new URLSearchParams('page=0'))).toEqual({ page: 1 });
    expect(parseTraderSearchParams(new URLSearchParams('page=-2'))).toEqual({ page: 1 });
    expect(parseTraderSearchParams(new URLSearchParams('page=abc'))).toEqual({ page: 1 });
    expect(parseTraderSearchParams(new URLSearchParams('page=2.5'))).toEqual({ page: 1 });
    expect(parseTraderSearchParams(new URLSearchParams(''))).toEqual({});
    expect(parseTraderSearchParams(new URLSearchParams('page=3'))).toEqual({ page: 3 });
  });

  it('clampPage defaults invalid values to 1', () => {
    expect(clampPage(0)).toBe(1);
    expect(clampPage(-1)).toBe(1);
    expect(clampPage('abc')).toBe(1);
    expect(clampPage('  ')).toBe(1);
    expect(clampPage(2)).toBe(2);
    expect(clampPage('3')).toBe(3);
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

  describe('last scan', () => {
    beforeEach(() => {
      window.sessionStorage.clear();
    });

    it('saves and reads the serialized scan', () => {
      expect(readLastScan()).toBeNull();
      saveLastScan('period=7D&roi_min=25');
      expect(readLastScan()).toBe('period=7D&roi_min=25');
    });

    it('clears on empty input', () => {
      saveLastScan('period=7D');
      saveLastScan('');
      expect(readLastScan()).toBeNull();
    });
  });
});
