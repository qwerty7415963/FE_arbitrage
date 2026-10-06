export type TraderPeriod = '1D' | '7D' | '30D' | 'ALL';

export type TraderSortBy = 'pnl' | 'roi' | 'win_rate' | 'volume' | 'trade_count' | 'last_trade';

export type SortDirection = 'asc' | 'desc';

export type DataStatus = 'ready' | 'syncing' | 'stale' | 'error';

export type DiscoverySource = 'leaderboard' | 'ws_trade' | 'both' | 'manual';

export interface RangeFilter {
  min?: number;
  max?: number;
}

export interface TraderSearchQuery {
  venue?: string;
  period?: TraderPeriod;
  roi?: RangeFilter;
  winRate?: RangeFilter;
  pnl?: RangeFilter;
  volume?: RangeFilter;
  tradeCount?: RangeFilter;
  profitFactor?: RangeFilter;
  longWinRate?: RangeFilter;
  shortWinRate?: RangeFilter;
  lastTradeAfter?: string;
  groupId?: string;
  sortBy?: TraderSortBy;
  sortDirection?: SortDirection;
  limit?: number;
  cursor?: string;
  page?: number;
}

export interface TraderSearchRequest {
  venue?: string;
  period?: TraderPeriod;
  roi_min?: number;
  roi_max?: number;
  win_rate_min?: number;
  win_rate_max?: number;
  pnl_min?: number;
  pnl_max?: number;
  volume_min?: number;
  volume_max?: number;
  trade_count_min?: number;
  trade_count_max?: number;
  profit_factor_min?: number;
  profit_factor_max?: number;
  long_win_rate_min?: number;
  long_win_rate_max?: number;
  short_win_rate_min?: number;
  short_win_rate_max?: number;
  last_trade_after?: string;
  group_id?: string;
  sort_by?: TraderSortBy;
  sort_direction?: SortDirection;
  limit?: number;
  cursor?: string;
  page?: number;
}

export interface PeriodMetrics {
  wallet_address: string;
  venue: string;
  venue_id: string | null;
  period: TraderPeriod;
  display_name: string | null;
  pnl: number | null;
  realized_pnl: number | null;
  roi: number | null;
  win_rate: number | null;
  volume: number | null;
  trade_count: number | null;
  profit_factor: number | null;
  max_drawdown_pct: number | null;
  long_count: number | null;
  long_wins: number | null;
  short_count: number | null;
  short_wins: number | null;
  gross_profit: number | null;
  gross_loss: number | null;
  avg_trade_pnl: number | null;
  avg_holding_time_sec: number | null;
  last_trade_at: string | null;
  data_status: DataStatus;
  is_partial: boolean;
  metrics_as_of: string | null;
  calculation_version: number;
}

export interface RegistryEntry {
  wallet_address: string;
  venue: string;
  venue_id: string | null;
  display_name: string | null;
  discovery_source: DiscoverySource;
  first_seen_at: string | null;
  last_seen_at: string | null;
  last_trade_at: string | null;
  leaderboard_seen_at: string | null;
  status: string;
}

export interface TraderDetail {
  registry: RegistryEntry;
  metrics: PeriodMetrics | null;
  period: TraderPeriod;
}

export interface TraderGroup {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  member_count: number;
}

export interface TraderMember {
  group_id: string;
  venue_id: string | null;
  venue: string;
  wallet_address: string;
  display_name: string | null;
  alias: string | null;
  note: string | null;
  metrics: PeriodMetrics | null;
}

export interface MemberInput {
  venue: string;
  wallet_address: string;
  alias?: string;
  note?: string;
}

export const TRADER_PERIODS: TraderPeriod[] = ['1D', '7D', '30D', 'ALL'];

export const DEFAULT_TRADER_PERIOD: TraderPeriod = '30D';

export const DEFAULT_VENUE = 'hyperliquid';

export const TRADER_VENUES: string[] = ['hyperliquid'];

export const TRADER_SORT_COLUMNS: TraderSortBy[] = [
  'pnl',
  'roi',
  'win_rate',
  'volume',
  'trade_count',
  'last_trade',
];

export const DEFAULT_SORT_BY: TraderSortBy = 'pnl';

export const DEFAULT_SORT_DIRECTION: SortDirection = 'desc';

export const SEARCH_LIMIT_DEFAULT = 50;

export const SEARCH_LIMIT_MIN = 1;

export const SEARCH_LIMIT_MAX = 100;

export const SCANNER_PAGE_SIZE = 20;

export const GROUP_NAME_MAX_RUNES = 100;

export const WALLET_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

export interface MetricRange {
  min: number | null;
  max: number | null;
  integer?: boolean;
}

export const TRADER_METRIC_RANGES: Record<string, MetricRange> = {
  roi: { min: null, max: null },
  win_rate: { min: 0, max: 100 },
  pnl: { min: null, max: null },
  volume: { min: 0, max: null },
  trade_count: { min: 0, max: null, integer: true },
  profit_factor: { min: 0, max: null },
  long_win_rate: { min: 0, max: 100 },
  short_win_rate: { min: 0, max: 100 },
};

export const DEFAULT_TRADER_SEARCH_QUERY: TraderSearchQuery = {
  venue: DEFAULT_VENUE,
  period: DEFAULT_TRADER_PERIOD,
  sortBy: DEFAULT_SORT_BY,
  sortDirection: DEFAULT_SORT_DIRECTION,
  limit: SCANNER_PAGE_SIZE,
  page: 1,
};
