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

export type PositionSide = 'LONG' | 'SHORT';

export type PositionDataStatus = 'ready' | 'syncing' | 'stale' | 'error';

export interface OpenPosition {
  coin: string;
  side: PositionSide;
  size: number;
  entry_price: number | null;
  mark_price: number | null;
  position_value: number | null;
  unrealized_pnl: number | null;
  return_on_equity: number | null;
  liquidation_price: number | null;
  leverage: number | null;
  max_leverage: number | null;
  margin_used: number | null;
  as_of: string | null;
}

export interface PositionSummary {
  account_value: number | null;
  total_ntl_pos: number | null;
  total_margin_used: number | null;
  as_of: string | null;
}

export interface PositionSnapshot {
  summary: PositionSummary | null;
  positions: OpenPosition[];
  data_status: PositionDataStatus;
  as_of: string | null;
}

export interface ActivityTrade {
  market: string;
  side: PositionSide;
  opened_at: string;
  closed_at: string;
  duration_sec: number;
  volume: number;
  entry_price: number | null;
  exit_price: number | null;
  pnl: number;
  fees: number;
  net_pnl: number;
  fills: number;
}

export interface ActivityCounts {
  win: number;
  loss: number;
  long: number;
  short: number;
  total: number;
}

export type ActivitySortKey =
  | 'closed_at'
  | 'opened_at'
  | 'market'
  | 'volume'
  | 'pnl'
  | 'net_pnl'
  | 'duration'
  | 'entry_price'
  | 'exit_price';

export type ActivityResultFilter = 'all' | 'win' | 'loss';

export type ActivitySideFilter = 'all' | 'long' | 'short';

export interface ActivityPage {
  rows: ActivityTrade[];
  next_cursor: string | null;
  has_more: boolean;
  counts: ActivityCounts;
  /**
   * Sync signal (contract v1.1 §2): derived from `trader_sync_state`.
   * Optional for backward compatibility with pre-v1.1 payloads/mocks;
   * consumers must treat a missing value as `ready`.
   */
  data_status?: DataStatus;
}

export interface ActivityQuery {
  venue?: string;
  limit?: number;
  cursor?: string;
  sort?: ActivitySortKey;
  dir?: SortDirection;
  result?: ActivityResultFilter;
  side?: ActivitySideFilter;
}

export interface ActivityFill {
  coin: string;
  side: 'BUY' | 'SELL';
  size: number;
  price: number;
  time: string;
  tid: number;
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

export type PositionSortKey =
  | 'coin'
  | 'size'
  | 'entry_price'
  | 'mark_price'
  | 'position_value'
  | 'unrealized_pnl'
  | 'return_on_equity'
  | 'leverage';

export const POSITION_SORT_KEYS: PositionSortKey[] = [
  'coin',
  'size',
  'entry_price',
  'mark_price',
  'position_value',
  'unrealized_pnl',
  'return_on_equity',
  'leverage',
];

export const DEFAULT_POSITION_SORT: PositionSortKey = 'coin';

export const DEFAULT_POSITION_DIR: SortDirection = 'asc';

export interface PositionQuery {
  venue?: string;
  sort?: PositionSortKey;
  dir?: SortDirection;
}

export const ACTIVITY_SORT_KEYS: ActivitySortKey[] = [
  'closed_at',
  'opened_at',
  'market',
  'volume',
  'pnl',
  'net_pnl',
  'duration',
  'entry_price',
  'exit_price',
];

export const DEFAULT_ACTIVITY_SORT: ActivitySortKey = 'closed_at';

export const DEFAULT_ACTIVITY_DIR: SortDirection = 'desc';

export const ACTIVITY_LIMIT_DEFAULT = 20;

export const ACTIVITY_LIMIT_MIN = 1;

export const ACTIVITY_LIMIT_MAX = 100;

export interface PerpBalances {
  account_value: number | null;
  total_ntl_pos: number | null;
  total_margin_used: number | null;
  withdrawable: number | null;
  cross_account_value: number | null;
  cross_total_ntl_pos: number | null;
  cross_total_margin_used: number | null;
  asset_positions_value: number | null;
  as_of: string | null;
}

export interface SpotBalanceRow {
  coin: string;
  token: string | null;
  total: number | null;
  hold: number | null;
  entry_ntl: number | null;
}

export interface SpotBalances {
  balances: SpotBalanceRow[];
  as_of: string | null;
}

export interface BalancesSnapshot {
  perp: PerpBalances | null;
  spot: SpotBalances | null;
  data_status: PositionDataStatus;
}

export type FillSide = 'BUY' | 'SELL';

export interface TraderFillRow {
  coin: string;
  side: FillSide;
  dir: string;
  size: number;
  price: number;
  closed_pnl: number;
  fee: number;
  fee_token: string;
  time: string;
  tid: number;
  oid: number;
  crossed: boolean;
  start_position: string;
}

export interface FillsPage {
  rows: TraderFillRow[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface FillsQuery {
  venue?: string;
  limit?: number;
  cursor?: string;
}

export const FILLS_LIMIT_DEFAULT = 100;

export const FILLS_LIMIT_MIN = 1;

export const FILLS_LIMIT_MAX = 200;

export type OrderStatusFilter = 'open' | 'historical';

export interface TraderOrderRow {
  coin: string;
  side: FillSide;
  limit_px: number;
  size: number;
  orig_size: number;
  oid: number;
  timestamp: string;
  reduce_only: boolean;
  order_type: string;
  trigger_condition: string;
  trigger_px: number | null;
  is_position_tpsl: boolean;
  order_status: string | null;
  status_timestamp: string | null;
}

export interface OrdersPage {
  status: OrderStatusFilter;
  rows: TraderOrderRow[];
}

export interface OrdersQuery {
  venue?: string;
  status?: OrderStatusFilter;
  limit?: number;
}

export const ORDERS_LIMIT_DEFAULT = 200;

export const ORDERS_LIMIT_MIN = 1;

export const ORDERS_LIMIT_MAX = 2000;

export type TransferType =
  | 'deposit'
  | 'withdraw'
  | 'internalTransfer'
  | 'subAccountTransfer'
  | 'accountClassTransfer'
  | 'spotTransfer'
  | 'send'
  | 'vaultDeposit'
  | 'vaultWithdraw'
  | 'vaultCreate'
  | 'vaultDistribution'
  | 'cStakingTransfer'
  | 'other';

export const TRANSFER_TYPES: TransferType[] = [
  'deposit',
  'withdraw',
  'internalTransfer',
  'subAccountTransfer',
  'accountClassTransfer',
  'spotTransfer',
  'send',
  'vaultDeposit',
  'vaultWithdraw',
  'vaultCreate',
  'vaultDistribution',
  'cStakingTransfer',
  'other',
];

export interface TransferRow {
  time: string;
  hash: string;
  type: TransferType;
  usdc: number | null;
  token: string | null;
  amount: number | null;
  usdc_value: number | null;
  is_deposit: boolean | null;
  source_dex: string | null;
  destination_dex: string | null;
  counterparty: string | null;
}

export interface TransfersPage {
  rows: TransferRow[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface TransfersQuery {
  venue?: string;
  days?: number;
  limit?: number;
  cursor?: string;
}

export const TRANSFERS_DAYS_DEFAULT = 30;

export const TRANSFERS_DAYS_MIN = 1;

export const TRANSFERS_DAYS_MAX = 180;

export const TRANSFERS_LIMIT_DEFAULT = 200;

export const TRANSFERS_LIMIT_MIN = 1;

export const TRANSFERS_LIMIT_MAX = 500;

export interface PerformanceMetrics {
  roi: number | null;
  pnl: number | null;
  win_rate: number | null;
  volume: number | null;
  trade_count: number | null;
  profit_factor: number | null;
  max_drawdown_pct: number | null;
  long_wins: number | null;
  long_count: number | null;
  short_wins: number | null;
  short_count: number | null;
  data_status: DataStatus;
  is_partial: boolean;
  metrics_as_of: string | null;
}

export interface EquityPoint {
  date: string;
  end_equity: number | null;
  daily_return: number | null;
}

export interface PerformanceSnapshot {
  period: TraderPeriod;
  metrics: PerformanceMetrics | null;
  equity: EquityPoint[];
}

export interface PerformanceQuery {
  venue?: string;
  period?: TraderPeriod;
}

export type WalletTabId =
  | 'positions'
  | 'balances'
  | 'predictions'
  | 'orders'
  | 'fills'
  | 'trades'
  | 'swap'
  | 'transfers'
  | 'performance';

export const WALLET_TABS: WalletTabId[] = [
  'positions',
  'balances',
  'predictions',
  'orders',
  'fills',
  'trades',
  'swap',
  'transfers',
  'performance',
];

export const DEFAULT_WALLET_TAB: WalletTabId = 'positions';

/**
 * `POST /traders/{wallet}/sync` result (contract v1.1 §1):
 * - `recent`: a sync completed within the 10-min debounce window (no-op).
 * - `in_flight`: a sync for this wallet is already running (no-op).
 * - `queued`: enqueued for the priority lane.
 */
export type TraderSyncStatus = 'queued' | 'in_flight' | 'recent';

export interface TraderSyncResult {
  status: TraderSyncStatus;
}

export interface TraderSyncQuery {
  venue?: string;
}
