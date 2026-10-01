import {
  TRADER_PERIODS,
  TRADER_SORT_COLUMNS,
  type RangeFilter,
  type SortDirection,
  type TraderPeriod,
  type TraderSearchQuery,
  type TraderSortBy,
} from '@/types/trader';

const RANGE_FIELDS = [
  { key: 'roi', min: 'roi_min', max: 'roi_max' },
  { key: 'winRate', min: 'win_rate_min', max: 'win_rate_max' },
  { key: 'pnl', min: 'pnl_min', max: 'pnl_max' },
  { key: 'volume', min: 'volume_min', max: 'volume_max' },
  { key: 'tradeCount', min: 'trade_count_min', max: 'trade_count_max' },
  { key: 'profitFactor', min: 'profit_factor_min', max: 'profit_factor_max' },
  { key: 'longWinRate', min: 'long_win_rate_min', max: 'long_win_rate_max' },
  { key: 'shortWinRate', min: 'short_win_rate_min', max: 'short_win_rate_max' },
] as const;

type RangeKey = (typeof RANGE_FIELDS)[number]['key'];

export function buildTraderSearchParams(query: TraderSearchQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.venue?.trim()) params.set('venue', query.venue.trim());
  if (query.period) params.set('period', query.period);
  for (const field of RANGE_FIELDS) {
    const range = query[field.key as RangeKey];
    if (range?.min !== undefined) params.set(field.min, String(range.min));
    if (range?.max !== undefined) params.set(field.max, String(range.max));
  }
  if (query.lastTradeAfter?.trim()) params.set('last_trade_after', query.lastTradeAfter.trim());
  if (query.groupId?.trim()) params.set('group_id', query.groupId.trim());
  if (query.sortBy) params.set('sort_by', query.sortBy);
  if (query.sortDirection) params.set('sort_direction', query.sortDirection);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.cursor) params.set('cursor', query.cursor);
  return params;
}

function parseNumberParam(params: URLSearchParams, name: string): number | undefined {
  const raw = params.get(name);
  if (raw === null || raw.trim() === '') return undefined;
  const value = Number(raw);
  return Number.isNaN(value) ? undefined : value;
}

export function parseTraderSearchParams(params: URLSearchParams): TraderSearchQuery {
  const query: TraderSearchQuery = {};
  const venue = params.get('venue')?.trim();
  if (venue) query.venue = venue;
  const period = params.get('period');
  if (period && (TRADER_PERIODS as string[]).includes(period)) {
    query.period = period as TraderPeriod;
  }
  for (const field of RANGE_FIELDS) {
    const min = parseNumberParam(params, field.min);
    const max = parseNumberParam(params, field.max);
    if (min !== undefined || max !== undefined) {
      const range: RangeFilter = {};
      if (min !== undefined) range.min = min;
      if (max !== undefined) range.max = max;
      query[field.key as RangeKey] = range;
    }
  }
  const lastTradeAfter = params.get('last_trade_after')?.trim();
  if (lastTradeAfter) query.lastTradeAfter = lastTradeAfter;
  const groupId = params.get('group_id')?.trim();
  if (groupId) query.groupId = groupId;
  const sortBy = params.get('sort_by');
  if (sortBy && (TRADER_SORT_COLUMNS as string[]).includes(sortBy)) {
    query.sortBy = sortBy as TraderSortBy;
  }
  const sortDirection = params.get('sort_direction');
  if (sortDirection === 'asc' || sortDirection === 'desc') {
    query.sortDirection = sortDirection as SortDirection;
  }
  const limit = parseNumberParam(params, 'limit');
  if (limit !== undefined) query.limit = limit;
  const cursor = params.get('cursor');
  if (cursor) query.cursor = cursor;
  return query;
}
