export type Timeframe = '24H' | '7D' | '30D' | '90D' | 'ALL';

export type WalletSortField =
  | 'pnl'
  | 'roi'
  | 'win_rate'
  | 'volume'
  | 'trade_count'
  | 'avg_position'
  | 'avg_leverage'
  | 'last_active';

export type SortOrder = 'asc' | 'desc';

export type MetricKey =
  | 'pnl'
  | 'roi'
  | 'win_rate'
  | 'volume'
  | 'trade_count'
  | 'avg_position'
  | 'avg_leverage'
  | 'long_short_ratio';

export type MetricOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'between';

export interface MetricFilter {
  metric: MetricKey;
  operator: MetricOperator;
  value?: number;
  min?: number;
  max?: number;
}

export interface WalletMetrics {
  realized_pnl: number | null;
  roi: number | null;
  volume: number | null;
  avg_position: number | null;
  avg_leverage: number | null;
  win_rate: number | null;
  trade_count: number | null;
  long_count: number | null;
  short_count: number | null;
  computed_at: string | null;
  last_active_at: string | null;
}

export interface Wallet {
  id: string;
  chain: string;
  address: string;
  dex: string | null;
  tag: string | null;
  first_seen_at: string | null;
  last_seen_at: string | null;
  metrics: WalletMetrics | null;
}

export interface GroupWallet extends Wallet {
  added_at: string;
}

export interface AddWalletsResult {
  added: number;
  skipped: number;
}

export interface GroupWalletQuery {
  search?: string;
  dex?: string[];
  chain?: string[];
  market?: string[];
  timeframe?: Timeframe;
  start?: string;
  end?: string;
  filters?: MetricFilter[];
  lastActiveWithin?: string;
  lastActiveFrom?: string;
  lastActiveTo?: string;
  sort?: WalletSortField;
  order?: SortOrder;
  page?: number;
  limit?: number;
}

export interface GroupWalletMeta {
  page?: number;
  limit?: number;
  total?: number;
  total_pages?: number;
  has_more?: boolean;
}

export const TIMEFRAMES: Timeframe[] = ['24H', '7D', '30D', '90D', 'ALL'];

export const SORT_FIELDS: WalletSortField[] = [
  'pnl',
  'roi',
  'win_rate',
  'volume',
  'trade_count',
  'avg_position',
  'avg_leverage',
  'last_active',
];

export const METRIC_KEYS: MetricKey[] = [
  'pnl',
  'roi',
  'win_rate',
  'volume',
  'trade_count',
  'avg_position',
  'avg_leverage',
  'long_short_ratio',
];

export const METRIC_OPERATORS: MetricOperator[] = ['gt', 'gte', 'lt', 'lte', 'between'];
