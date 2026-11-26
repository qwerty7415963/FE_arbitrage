import type {
  GroupActivityPage,
  GroupAlert,
  GroupAlertEvent,
  GroupCompareResponse,
  GroupCompareStats,
  GroupListItem,
  GroupPerformanceResponse,
  GroupPositionsResponse,
  GroupStats,
  GroupsOverview,
} from '@/types/trader';

export const sampleGroup: GroupListItem = {
  id: 'group-1',
  name: 'Top Traders',
  description: 'High-ROI wallets',
  is_favorite: true,
  notify_enabled: false,
  member_count: 12,
  account_value: 12345.67,
  unrealized_pnl: -12.34,
  roi: 0.0431,
  volume: 999000,
  open_positions: 4,
  win_rate: 0.53,
  updated_at: '2026-11-23T10:00:00Z',
  data_status: 'ready',
  partial: false,
  missing_wallets: 0,
};

export const sampleGroups: GroupListItem[] = [
  sampleGroup,
  {
    id: 'group-2',
    name: 'Swing Traders',
    description: null,
    is_favorite: false,
    notify_enabled: true,
    member_count: 5,
    account_value: 5000,
    unrealized_pnl: 100.5,
    roi: 0.02,
    volume: 120000,
    open_positions: 2,
    win_rate: 0.6,
    updated_at: '2026-11-23T09:30:00Z',
    data_status: 'partial',
    partial: true,
    missing_wallets: 1,
  },
];

export const sampleGroupsOverview: GroupsOverview = {
  total_groups: 2,
  unique_wallets: 15,
  account_value: 17345.67,
  unrealized_pnl: 88.16,
  partial: false,
  missing_wallets: 0,
  stale_groups: 0,
  empty_groups: 0,
  as_of: '2026-11-23T10:00:00Z',
};

export const sampleGroupStats: GroupStats = {
  period: '30D',
  from: '2026-10-24',
  to: '2026-11-23',
  as_of: '2026-11-23T10:00:00Z',
  evaluated_at: '2026-11-23T10:00:00Z',
  data_status: 'ready',
  partial: false,
  members_total: 12,
  members_with_data: 12,
  missing_wallets: 0,
  account_value: 12345.67,
  total_notional: 8000,
  unrealized_pnl: -12.34,
  realized_pnl: 440.5,
  roi: 0.0431,
  win_count: 21,
  loss_count: 5,
  breakeven_count: 2,
  trade_count: 120,
  win_rate: 0.53,
  volume: 500000,
  profit_factor: 1.8,
  max_drawdown_pct: 7.2,
  open_positions: 4,
  definitions_version: 2,
};

export const sampleGroupPerformance: GroupPerformanceResponse = {
  period: '30D',
  granularity: 'daily',
  from: '2026-10-24T00:00:00Z',
  to: '2026-11-23T00:00:00Z',
  partial: false,
  missing_wallets: 0,
  insufficient_data: false,
  metric_availability: { account_value: true, cumulative_realized_pnl: true, roi: true },
  points: [
    { t: '2026-10-24T00:00:00Z', account_value: 12000, cumulative_realized_pnl: 0, roi_index: 100 },
    {
      t: '2026-11-23T00:00:00Z',
      account_value: 12345.67,
      cumulative_realized_pnl: 440.5,
      roi_index: 104.31,
    },
  ],
};

export const sampleGroupPositions: GroupPositionsResponse = {
  as_of: '2026-11-23T10:00:00Z',
  data_status: 'ready',
  partial: false,
  missing_wallets: 0,
  totals: { long_ntl: 5000, short_ntl: 3000, net_ntl: 2000, gross_ntl: 8000, open_positions: 6 },
  positions: [
    {
      coin: 'BTC',
      long_ntl: 5000,
      short_ntl: 0,
      net_ntl: 5000,
      gross_ntl: 5000,
      wallet_count: 2,
      unrealized_pnl: 120,
      wallets: [
        {
          wallet_address: '0xabc123',
          display_name: 'Smart Money',
          alias: 'whale-1',
          side: 'LONG',
          size: 1.2,
          entry_price: 60000,
          mark_price: 61000,
          leverage: 3,
          liquidation_price: 55000,
          distance_to_liquidation_pct: 9.84,
          position_value: 73200,
          unrealized_pnl: 1200,
          as_of: '2026-11-23T10:00:00Z',
          stale: false,
        },
      ],
    },
  ],
};

export const sampleGroupActivity: GroupActivityPage = {
  items: [
    {
      id: 1,
      type: 'position_closed',
      occurred_at: '2026-11-23T09:50:00Z',
      venue: 'hyperliquid',
      wallet_address: '0xabc123',
      coin: 'BTC',
      size_delta: -1.2,
      price: 61000,
      realized_pnl: 120,
      meta: {},
    },
  ],
  next_cursor: null,
  has_more: false,
  partial: false,
  sources: { trades: true, fills: true, transfers: false },
};

export const sampleGroupAlert: GroupAlert = {
  id: 'alert-1',
  group_id: 'group-1',
  user_id: 'user-1',
  name: 'BTC exposure',
  type: 'exposure_above',
  params: { metric: 'gross', threshold_usd: 10000 },
  enabled: true,
  cooldown_seconds: 300,
  notify_in_app: true,
  notify_telegram: false,
  last_condition_met: false,
  last_value: 8000,
  last_triggered_at: null,
  last_evaluated_at: '2026-11-23T10:00:00Z',
  created_at: '2026-11-23T09:00:00Z',
  updated_at: '2026-11-23T09:00:00Z',
  unread_events: 1,
};

export const sampleGroupAlertEvent: GroupAlertEvent = {
  id: 'event-1',
  alert_id: 'alert-1',
  group_id: 'group-1',
  type: 'exposure_above',
  payload: { value: 12000 },
  triggered_at: '2026-11-23T10:05:00Z',
  read_at: null,
};

export const sampleCompareResponse: GroupCompareResponse = {
  period: '30D',
  groups: [
    {
      id: 'group-1',
      name: 'Top Traders',
      member_count: 12,
      stats: sampleGroupStats as GroupCompareStats,
    },
  ],
  series: [{ group_id: 'group-1', points: [{ t: '2026-11-23T00:00:00Z', roi_index: 104.31 }] }],
  overlap: { pairwise: [{ a: 'group-1', b: 'group-2', shared_wallets: 2 }] },
  warnings: ['groups share wallets; results are not independent portfolios'],
  as_of: '2026-11-23T10:00:00Z',
};
