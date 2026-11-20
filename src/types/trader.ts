import type { Meta } from './api';
export type TraderPeriod = '1D' | '7D' | '30D' | 'ALL';

export type TraderSortBy = 'pnl' | 'roi' | 'win_rate' | 'volume' | 'trade_count' | 'last_trade';

export type SortDirection = 'asc' | 'desc';

export type DataStatus = 'ready' | 'syncing' | 'stale' | 'error';

/**
 * Live detail status (contract v1.2 §1): wallet detail tabs only ever
 * report `ready` or `error`. Never `syncing`/`stale` in detail.
 * `DataStatus` (4 values) stays for the scanner, which keeps its own sync.
 */
export type LiveDataStatus = 'ready' | 'error';

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
  notify_enabled: boolean;
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

/** Live detail positions status (contract v1.2 §1.1): ready|error only. */
export type PositionDataStatus = LiveDataStatus;

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
  tp_pxs?: number[];
  sl_pxs?: number[];
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
  /**
   * Signed funding attributed to this trade window (contract v1.2 §1.2).
   * Negative = paid. Informational only; `net_pnl = pnl − fees` (unchanged),
   * win/loss/counts still on `net_pnl`.
   */
  funding: number;
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
   * Live signal (contract v1.2 §1.2): ready|error only, never
   * syncing/stale. Required; `as_of` is fetch time (never null on
   * success), `partial` is true when the venue truncated the window.
   */
  data_status: LiveDataStatus;
  as_of: string | null;
  partial: boolean;
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
  /**
   * Fill direction (SIDEBAR-3EVENTS D1, additive over contract v1.2).
   * `Open Long` / `Open Short` render as LONG/SHORT; `Buy`/`Sell` fall back
   * to BUY/SELL; `Close*` fills are skipped by the sidebar (the completed
   * cycle represents them).
   */
  dir: string;
}

/**
 * Sidebar 3-event timeline (SIDEBAR-3EVENTS, frozen delta over v1.2).
 * Single merged timeline, time DESC, cap 50. `limit` comes from
 * `wallet.order.created`, `fill` from `wallet.fill.created` with an open
 * direction, `close` from `wallet.activity.created`.
 */
export interface LiveLimitItem {
  kind: 'limit';
  time: string;
  order: WalletOrderEvent;
}

export interface LiveFillItem {
  kind: 'fill';
  time: string;
  fill: ActivityFill;
}

export interface LiveCloseItem {
  kind: 'close';
  time: string;
  trade: ActivityTrade;
}

export type LiveActivityItem = LiveLimitItem | LiveFillItem | LiveCloseItem;

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
  data_status: LiveDataStatus;
  is_partial: boolean;
  metrics_as_of: string | null;
}

export interface EquityPoint {
  date: string;
  end_equity: number | null;
  daily_return: number | null;
}

export type PortfolioRange = '24H' | '7D' | '30D' | 'ALL';

export type PortfolioMode = 'perps' | 'combined';

export interface PortfolioSeriesPoint {
  time: string;
  value: number;
}

export interface PortfolioRangeSeries {
  account_value: PortfolioSeriesPoint[];
  pnl: PortfolioSeriesPoint[];
}

export interface PerformanceSnapshot {
  period: TraderPeriod;
  metrics: PerformanceMetrics | null;
  equity: EquityPoint[];
  mode?: PortfolioMode;
  series?: Partial<Record<PortfolioRange, PortfolioRangeSeries>>;
}

export interface PerformanceQuery {
  venue?: string;
  period?: TraderPeriod;
  mode?: PortfolioMode;
  seriesOnly?: boolean;
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
 * Realtime wallet envelopes (contract v1.2 §2 + fixtures §6).
 * Shapes below are exactly the fixture shapes; no invented fields.
 */
export type WalletConnectionStatus =
  'DISCONNECTED' | 'RECONNECTING' | 'RESYNCING' | 'RECONCILING' | 'LIVE' | 'ERROR';

export const WALLET_CONNECTION_STATUSES: WalletConnectionStatus[] = [
  'DISCONNECTED',
  'RECONNECTING',
  'RESYNCING',
  'RECONCILING',
  'LIVE',
  'ERROR',
];

export interface WalletFillEvent {
  coin: string;
  side: 'BUY' | 'SELL';
  size: number;
  price: number;
  time: string;
  tid: number;
}

export interface WalletFundingEvent {
  coin: string;
  usdc: number;
  time: string;
}

export interface WalletOrderEvent {
  coin: string;
  oid: number;
  status: string;
  /**
   * Limit placement fields (SIDEBAR-3EVENTS: `wallet.order.created`
   * {coin, oid, status:"open", side, limit_px, size(orig), timestamp}).
   * Optional to stay backward compatible with the minimal
   * `wallet.order.updated` shape {coin, oid, status}.
   */
  side?: string;
  limit_px?: number;
  size?: number;
  orig_size?: number;
  timestamp?: string;
  time?: string;
}

export interface WalletConnectionEvent {
  status: WalletConnectionStatus;
}

export type WalletWsEventType =
  | 'wallet.fill.created'
  | 'wallet.funding.created'
  | 'wallet.order.updated'
  | 'wallet.order.created'
  | 'wallet.position.updated'
  | 'wallet.activity.created'
  | 'wallet.state.updated'
  | 'wallet.connection.updated';

export interface TraderSyncQuery {
  venue?: string;
}

export type OverviewPoint = { t: string; v: number };

export type OverviewBucketId =
  | 'extremely_profitable'
  | 'very_profitable'
  | 'profitable'
  | 'unprofitable'
  | 'very_unprofitable'
  | 'rekt';

export type OverviewAccountBucketId = 'apex' | 'whale' | 'large' | 'medium' | 'small';

export type OverviewSentiment =
  | 'very_bullish'
  | 'bullish'
  | 'slightly_bullish'
  | 'neutral'
  | 'slightly_bearish'
  | 'bearish'
  | 'very_bearish';

export interface OverviewBucket {
  id: OverviewBucketId;
  min_pnl: number | null;
  max_pnl: number | null;
  wallet_count: number;
  pnl_total: number;
  volume_total: number;
  long_count: number;
  short_count: number;
  long_ratio: number;
  long_notional: number;
  short_notional: number;
  sentiment: OverviewSentiment;
  series: OverviewPoint[] | null;
}

export interface OverviewAccountBucket {
  id: OverviewAccountBucketId;
  min_equity: number | null;
  max_equity: number | null;
  wallet_count: number;
  equity_total: number;
  volume_total: number;
  long_count: number;
  short_count: number;
  long_ratio: number;
  long_notional: number;
  short_notional: number;
  sentiment: OverviewSentiment;
  series: OverviewPoint[] | null;
}

export interface OverviewCoverageDataStatus {
  ready: number;
  stale: number;
  error: number;
  syncing: number;
}

export interface OverviewCoverage {
  pnl_wallets: number;
  account_value_wallets: number;
  series_wallets: number;
  data_status: OverviewCoverageDataStatus;
}

export interface TraderOverview {
  as_of: string;
  venue: string;
  period: TraderPeriod | string;
  pnl_metric: string;
  universe_size: number;
  pnl_buckets: OverviewBucket[];
  account_buckets: OverviewAccountBucket[];
  coverage: OverviewCoverage;
}

export interface OverviewSeriesPoint {
  date: string;
  bucket: string;
  pnl: number;
}

export interface TraderOverviewSeries {
  venue: string;
  period: string;
  pnl_metric: string;
  series_days: number;
  pnl_series: OverviewSeriesPoint[];
  account_series: OverviewSeriesPoint[];
  series_wallets: number;
}

export type OverviewSeries = TraderOverviewSeries;
export type BucketKind = 'pnl' | 'account';

export type BucketRange = '24H' | '7D' | '30D';

export interface BucketPnlSplit {
  pct_profit: number;
  pct_loss: number;
  usd_profit: number;
  usd_loss: number;
}

export interface BucketNotionalSplit {
  long_usd: number;
  short_usd: number;
}

export interface BucketPositioningPoint {
  t: string;
  long_pct: number;
}

export interface BucketMarketTop {
  market: string;
  notional: number;
  upnl: number;
  sentiment: OverviewSentiment | string;
  traders: number;
  asset_id: string;
  asset_category: string;
  logo_url: string | null;
}

export interface BucketDetailCoverage {
  wallets_with_positions: number;
  wallets_with_trades: number;
}

export interface BucketDetail {
  as_of: string;
  kind: BucketKind | string;
  bucket_id: string;
  wallet_count: number;
  sentiment: OverviewSentiment | string;
  long_ratio: number;
  pnl_split: BucketPnlSplit;
  notional_split: BucketNotionalSplit;
  positioning: BucketPositioningPoint[] | null;
  markets_top: BucketMarketTop[] | null;
  coverage: BucketDetailCoverage;
  markets_source: 'positions' | 'trades';
  notional_source?: string;
}

export interface BucketWalletRow {
  address: string;
  display_name: string | null;
  perp_equity: number;
  position_value: number | null;
  leverage: number;
  win_rate: number | null;
  volume_range: number | null;
  realized_pnl: number | null;
  sum_upnl: number | null;
  bias: string;
  cohort: string;
  long_count?: number;
  short_count?: number;
}

export interface BucketMarketRow {
  market: string;
  sentiment: string;
  notional_long: number;
  notional_short: number;
  traders_long: number;
  traders_short: number;
  pnl_profit: number;
  pnl_loss: number;
  asset_id: string;
  asset_category: string;
  logo_url: string | null;
}
export interface MarketDetailHeader {
  venue: string;
  market: string;
  mark_price: number | null;
  index_price: number | null;
  funding_rate: number | null;
  next_funding_at: string | null;
  market_oi: number | null;
  logo_url: string;
  category: string;
  enabled: boolean;
  as_of: string;
}

export interface MarketSnapshot {
  open_notional_long: number;
  open_notional_short: number;
  long_short_ratio: number;
  unrealized_pnl_long: number;
  unrealized_pnl_short: number;
  net_unrealized_pnl: number | null;
  traders_long: number;
  traders_short: number;
  traders_total: number;
  margin_used_long: number;
  margin_used_short: number;
  margin_used_total: number | null;
  avg_leverage_long: number | null;
  avg_leverage_short: number | null;
  market_oi: number | null;
  synced_at: string;
}

export interface MarketDetailCoverage {
  tracked_wallets_with_positions: number;
  total_wallets_in_market: number;
}

export interface MarketWalletRow {
  address: string;
  display_name: string | null;
  cohort: string;
  bias: string;
  volume: number;
  trades: number;
  win_rate: number | null;
  realized_pnl: number;
  long_count: number;
  short_count: number;
  last_trade_at: string | null;
  position_side: string;
  position_notional: number | null;
  position_upnl: number | null;
  position_leverage: number | null;
  margin_used: number | null;
}

export interface MarketTradeRow {
  closed_at: string;
  wallet_address: string;
  display_name: string | null;
  side: string;
  size: number;
  entry_price: number | null;
  exit_price: number | null;
  volume: number;
  pnl: number;
  fees: number;
  fills: number;
}

export interface MarketDetailResponse {
  header: MarketDetailHeader;
  snapshot: MarketSnapshot;
  coverage: MarketDetailCoverage;
}

export interface MarketWalletsResponse {
  data: MarketWalletRow[];
  meta: Meta;
}

export interface MarketTradesResponse {
  data: MarketTradeRow[];
  meta: Meta;
}

export interface WatchedMarket {
  venue: string;
  market: string;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
