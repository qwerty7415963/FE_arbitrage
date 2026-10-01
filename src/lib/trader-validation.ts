import {
  SEARCH_LIMIT_MAX,
  SEARCH_LIMIT_MIN,
  TRADER_METRIC_RANGES,
  TRADER_PERIODS,
  TRADER_SORT_COLUMNS,
  type RangeFilter,
  type TraderSearchQuery,
} from '@/types/trader';

export type TraderSearchError =
  | 'minGreaterThanMax'
  | 'invalidNumber'
  | 'outOfRange'
  | 'invalidInteger'
  | 'invalidDateTime'
  | 'invalidLimit'
  | 'invalidSort'
  | 'invalidPeriod';

const RANGE_KEYS = [
  'roi',
  'winRate',
  'pnl',
  'volume',
  'tradeCount',
  'profitFactor',
  'longWinRate',
  'shortWinRate',
] as const;

const RANGE_TO_METRIC: Record<(typeof RANGE_KEYS)[number], string> = {
  roi: 'roi',
  winRate: 'win_rate',
  pnl: 'pnl',
  volume: 'volume',
  tradeCount: 'trade_count',
  profitFactor: 'profit_factor',
  longWinRate: 'long_win_rate',
  shortWinRate: 'short_win_rate',
};

function validateRange(range: RangeFilter | undefined, metric: string): TraderSearchError | null {
  if (!range) return null;
  const config = TRADER_METRIC_RANGES[metric];
  for (const value of [range.min, range.max]) {
    if (value === undefined) continue;
    if (typeof value !== 'number' || Number.isNaN(value)) return 'invalidNumber';
    if (config?.integer && !Number.isInteger(value)) return 'invalidInteger';
    if (
      config &&
      ((config.min !== null && value < config.min) || (config.max !== null && value > config.max))
    ) {
      return 'outOfRange';
    }
  }
  if (range.min !== undefined && range.max !== undefined && range.min > range.max) {
    return 'minGreaterThanMax';
  }
  return null;
}

export function validateTraderSearch(query: TraderSearchQuery): TraderSearchError | null {
  for (const key of RANGE_KEYS) {
    const error = validateRange(query[key], RANGE_TO_METRIC[key]);
    if (error) return error;
  }
  if (query.lastTradeAfter?.trim() && Number.isNaN(Date.parse(query.lastTradeAfter.trim()))) {
    return 'invalidDateTime';
  }
  if (
    query.limit !== undefined &&
    (!Number.isInteger(query.limit) ||
      query.limit < SEARCH_LIMIT_MIN ||
      query.limit > SEARCH_LIMIT_MAX)
  ) {
    return 'invalidLimit';
  }
  if (
    (query.sortBy && !TRADER_SORT_COLUMNS.includes(query.sortBy)) ||
    (query.sortDirection && query.sortDirection !== 'asc' && query.sortDirection !== 'desc')
  ) {
    return 'invalidSort';
  }
  if (query.period && !TRADER_PERIODS.includes(query.period)) {
    return 'invalidPeriod';
  }
  return null;
}

const WALLET_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

export function isValidWalletAddress(address: string | undefined | null): boolean {
  return typeof address === 'string' && WALLET_ADDRESS_PATTERN.test(address.trim());
}
