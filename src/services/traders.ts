import { apiClient } from '@/infrastructure/api-client';
import type { ApiResponse, Meta } from '@/types/api';
import {
  ACTIVITY_LIMIT_DEFAULT,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_DIRECTION,
  DEFAULT_TRADER_PERIOD,
  DEFAULT_VENUE,
  FILLS_LIMIT_DEFAULT,
  ORDERS_LIMIT_DEFAULT,
  SEARCH_LIMIT_DEFAULT,
  TRANSFERS_DAYS_DEFAULT,
  TRANSFERS_LIMIT_DEFAULT,
  type ActivityPage,
  type ActivityQuery,
  type BalancesSnapshot,
  type FillsPage,
  type FillsQuery,
  type MemberInput,
  type OrdersPage,
  type OrdersQuery,
  type PerformanceQuery,
  type PerformanceSnapshot,
  type PeriodMetrics,
  type PositionQuery,
  type PositionSnapshot,
  type RangeFilter,
  type TraderDetail,
  type BucketDetail,
  type BucketMarketRow,
  type BucketWalletRow,
  type MarketDetailResponse,
  type MarketTradeRow,
  type MarketWalletRow,
  type WatchedMarket,
  type TraderGroup,
  type GroupListItem,
  type GroupsOverview,
  type GroupPerformanceResponse,
  type GroupPositionsResponse,
  type GroupActivityPage,
  type GroupStats,
  type GroupAlert,
  type GroupAlertEventsPage,
  type GroupCompareResponse,
  type TraderMember,
  type TraderOverview,
  type TraderOverviewSeries,
  type TraderSearchQuery,
  type TraderSearchRequest,
  type TransfersPage,
  type TransfersQuery,
} from '@/types/trader';

const TRADERS_BASE = '/api/v1/traders';
const TRADER_GROUPS_BASE = '/api/v1/trader-groups';

function assignRange(
  body: TraderSearchRequest,
  prefix: string,
  range: RangeFilter | undefined,
): void {
  if (range?.min !== undefined) {
    (body as Record<string, number>)[`${prefix}_min`] = range.min;
  }
  if (range?.max !== undefined) {
    (body as Record<string, number>)[`${prefix}_max`] = range.max;
  }
}

export function buildTraderSearchRequest(query: TraderSearchQuery): TraderSearchRequest {
  const body: TraderSearchRequest = {};
  if (query.venue?.trim()) body.venue = query.venue.trim();
  if (query.period) body.period = query.period;
  assignRange(body, 'roi', query.roi);
  assignRange(body, 'win_rate', query.winRate);
  assignRange(body, 'pnl', query.pnl);
  assignRange(body, 'volume', query.volume);
  assignRange(body, 'trade_count', query.tradeCount);
  assignRange(body, 'profit_factor', query.profitFactor);
  assignRange(body, 'long_win_rate', query.longWinRate);
  assignRange(body, 'short_win_rate', query.shortWinRate);
  if (query.lastTradeAfter?.trim()) body.last_trade_after = query.lastTradeAfter.trim();
  if (query.groupId?.trim()) body.group_id = query.groupId.trim();
  if (query.sortBy) body.sort_by = query.sortBy;
  if (query.sortDirection) body.sort_direction = query.sortDirection;
  if (query.limit !== undefined) body.limit = query.limit;
  if (query.cursor) body.cursor = query.cursor;
  if (query.page !== undefined) body.page = query.page;
  return body;
}

export interface SearchOptions {
  signal?: AbortSignal;
}

export async function searchTraders(
  query: TraderSearchQuery = {},
  options: SearchOptions = {},
): Promise<{ data: PeriodMetrics[]; meta: Meta }> {
  const res = await apiClient<ApiResponse<PeriodMetrics[]>>(`${TRADERS_BASE}/search`, {
    method: 'POST',
    body: JSON.stringify(
      buildTraderSearchRequest({
        ...query,
        venue: query.venue ?? DEFAULT_VENUE,
        period: query.period ?? DEFAULT_TRADER_PERIOD,
        sortBy: query.sortBy ?? DEFAULT_SORT_BY,
        sortDirection: query.sortDirection ?? DEFAULT_SORT_DIRECTION,
        limit: query.limit ?? SEARCH_LIMIT_DEFAULT,
        page: query.page ?? 1,
      }),
    ),
    signal: options.signal,
  });
  const data = res.data ?? [];
  return { data, meta: res.meta || {} };
}

export async function fetchTraderDetail(
  walletAddress: string,
  query: { venue?: string; period?: TraderDetail['period'] } = {},
  options: SearchOptions = {},
): Promise<TraderDetail> {
  const params = new URLSearchParams();
  params.set('venue', query.venue ?? DEFAULT_VENUE);
  params.set('period', query.period ?? DEFAULT_TRADER_PERIOD);
  const res = await apiClient<ApiResponse<TraderDetail>>(
    `${TRADERS_BASE}/${walletAddress}?${params.toString()}`,
    { signal: options.signal, timeout: 60000 },
  );
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function fetchTraderPositions(
  walletAddress: string,
  query: PositionQuery = {},
  options: SearchOptions = {},
): Promise<PositionSnapshot> {
  const params = new URLSearchParams();
  params.set('venue', query.venue ?? DEFAULT_VENUE);
  if (query.sort) params.set('sort', query.sort);
  if (query.dir) params.set('dir', query.dir);
  const res = await apiClient<ApiResponse<PositionSnapshot>>(
    `${TRADERS_BASE}/${walletAddress}/positions?${params.toString()}`,
    { signal: options.signal },
  );
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function fetchTraderActivity(
  walletAddress: string,
  query: ActivityQuery = {},
  options: SearchOptions = {},
): Promise<ActivityPage> {
  const params = new URLSearchParams();
  params.set('venue', query.venue ?? DEFAULT_VENUE);
  params.set('limit', String(query.limit ?? ACTIVITY_LIMIT_DEFAULT));
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.sort) params.set('sort', query.sort);
  if (query.dir) params.set('dir', query.dir);
  if (query.result) params.set('result', query.result);
  if (query.side) params.set('side', query.side);
  const res = await apiClient<ApiResponse<ActivityPage>>(
    `${TRADERS_BASE}/${walletAddress}/activity?${params.toString()}`,
    { signal: options.signal },
  );
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function fetchTraderBalances(
  walletAddress: string,
  query: { venue?: string } = {},
  options: SearchOptions = {},
): Promise<BalancesSnapshot> {
  const params = new URLSearchParams();
  params.set('venue', query.venue ?? DEFAULT_VENUE);
  const res = await apiClient<ApiResponse<BalancesSnapshot>>(
    `${TRADERS_BASE}/${walletAddress}/balances?${params.toString()}`,
    { signal: options.signal },
  );
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function fetchTraderFills(
  walletAddress: string,
  query: FillsQuery = {},
  options: SearchOptions = {},
): Promise<FillsPage> {
  const params = new URLSearchParams();
  params.set('venue', query.venue ?? DEFAULT_VENUE);
  params.set('limit', String(query.limit ?? FILLS_LIMIT_DEFAULT));
  if (query.cursor) params.set('cursor', query.cursor);
  const res = await apiClient<ApiResponse<FillsPage>>(
    `${TRADERS_BASE}/${walletAddress}/fills?${params.toString()}`,
    { signal: options.signal },
  );
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function fetchTraderOrders(
  walletAddress: string,
  query: OrdersQuery = {},
  options: SearchOptions = {},
): Promise<OrdersPage> {
  const params = new URLSearchParams();
  params.set('venue', query.venue ?? DEFAULT_VENUE);
  params.set('status', query.status ?? 'open');
  params.set('limit', String(query.limit ?? ORDERS_LIMIT_DEFAULT));
  const res = await apiClient<ApiResponse<OrdersPage>>(
    `${TRADERS_BASE}/${walletAddress}/orders?${params.toString()}`,
    { signal: options.signal },
  );
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function fetchTraderTransfers(
  walletAddress: string,
  query: TransfersQuery = {},
  options: SearchOptions = {},
): Promise<TransfersPage> {
  const params = new URLSearchParams();
  params.set('venue', query.venue ?? DEFAULT_VENUE);
  params.set('days', String(query.days ?? TRANSFERS_DAYS_DEFAULT));
  params.set('limit', String(query.limit ?? TRANSFERS_LIMIT_DEFAULT));
  if (query.cursor) params.set('cursor', query.cursor);
  const res = await apiClient<ApiResponse<TransfersPage>>(
    `${TRADERS_BASE}/${walletAddress}/transfers?${params.toString()}`,
    { signal: options.signal },
  );
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function fetchTraderPerformance(
  walletAddress: string,
  query: PerformanceQuery = {},
  options: SearchOptions = {},
): Promise<PerformanceSnapshot> {
  const params = new URLSearchParams();
  params.set('venue', query.venue ?? DEFAULT_VENUE);
  params.set('period', query.period ?? DEFAULT_TRADER_PERIOD);
  params.set('mode', query.mode ?? 'perps');
  if (query.seriesOnly) params.set('series_only', 'true');
  const res = await apiClient<ApiResponse<PerformanceSnapshot>>(
    `${TRADERS_BASE}/${walletAddress}/performance?${params.toString()}`,
    { signal: options.signal },
  );
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function fetchTraderOverview(
  params: { venue?: string; period?: string; seriesDays?: number } = {},
  options: SearchOptions = {},
): Promise<TraderOverview> {
  const search = new URLSearchParams();
  search.set('venue', params.venue ?? DEFAULT_VENUE);
  search.set('period', params.period ?? DEFAULT_TRADER_PERIOD);
  search.set('series_days', String(params.seriesDays ?? 30));
  const res = await apiClient<ApiResponse<TraderOverview>>(
    `${TRADERS_BASE}/overview?${search.toString()}`,
    { signal: options.signal },
  );
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function fetchTraderOverviewSeries(
  params: {
    venue?: string;
    period?: string;
    pnlMetric?: string;
    pnl_metric?: string;
    seriesDays?: number;
    series_days?: number;
  } = {},
  options: SearchOptions = {},
): Promise<TraderOverviewSeries> {
  const search = new URLSearchParams();
  search.set('venue', params.venue ?? DEFAULT_VENUE);
  search.set('period', params.period ?? DEFAULT_TRADER_PERIOD);
  const pnlMetric = params.pnlMetric ?? params.pnl_metric ?? 'realized_pnl';
  search.set('pnl_metric', pnlMetric);
  const seriesDays = params.seriesDays ?? params.series_days ?? 30;
  search.set('series_days', String(seriesDays));
  const res = await apiClient<ApiResponse<TraderOverviewSeries>>(
    `${TRADERS_BASE}/overview/series?${search.toString()}`,
    { signal: options.signal },
  );
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function listTraderGroups(): Promise<TraderGroup[]> {
  const res = await apiClient<ApiResponse<TraderGroup[]>>(TRADER_GROUPS_BASE);
  return res.data ?? [];
}

interface GroupsListResponse {
  success: boolean;
  data?: GroupListItem[];
  meta?: Meta;
  as_of?: string;
}

export async function listTraderGroupsDetailed(
  params: {
    search?: string;
    favorite?: boolean;
    status?: string;
    period?: string;
    sort?: string;
    dir?: 'asc' | 'desc';
    page?: number;
    page_size?: number;
  } = {},
): Promise<{ items: GroupListItem[]; meta: Meta; as_of: string }> {
  const sp = new URLSearchParams();
  if (params.search) sp.set('search', params.search);
  if (params.favorite !== undefined) sp.set('favorite', String(params.favorite));
  if (params.status) sp.set('status', params.status);
  if (params.period) sp.set('period', params.period);
  if (params.sort) sp.set('sort', params.sort);
  if (params.dir) sp.set('dir', params.dir);
  if (params.page) sp.set('page', String(params.page));
  if (params.page_size) sp.set('page_size', String(params.page_size));
  const res = await apiClient<GroupsListResponse>(`${TRADER_GROUPS_BASE}?${sp.toString()}`);
  return {
    items: res.data ?? [],
    meta: res.meta ?? { total: 0, page: 1, total_pages: 1, limit: params.page_size ?? 20 },
    as_of: res.as_of ?? '',
  };
}

export async function getGroupsOverview(
  period: '1D' | '7D' | '30D' | '90D' | 'ALL' = '30D',
): Promise<GroupsOverview> {
  const res = await apiClient<ApiResponse<GroupsOverview>>(
    `${TRADER_GROUPS_BASE}/overview?period=${period}`,
  );
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function getGroupStats(
  id: string,
  period: '1D' | '7D' | '30D' | '90D' | 'ALL' = '30D',
): Promise<GroupStats> {
  const res = await apiClient<ApiResponse<GroupStats>>(
    `${TRADER_GROUPS_BASE}/${id}/stats?period=${period}`,
  );
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function getGroupPerformance(
  id: string,
  period: '1D' | '7D' | '30D' | '90D' | 'ALL' = '30D',
): Promise<GroupPerformanceResponse> {
  const res = await apiClient<ApiResponse<GroupPerformanceResponse>>(
    `${TRADER_GROUPS_BASE}/${id}/performance?period=${period}`,
  );
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function getGroupPositions(id: string): Promise<GroupPositionsResponse> {
  const res = await apiClient<ApiResponse<GroupPositionsResponse>>(
    `${TRADER_GROUPS_BASE}/${id}/positions`,
  );
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function getGroupActivity(
  id: string,
  params: { limit?: number; cursor?: string; wallet?: string; asset?: string; type?: string } = {},
): Promise<GroupActivityPage> {
  const sp = new URLSearchParams();
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.cursor) sp.set('cursor', params.cursor);
  if (params.wallet) sp.set('wallet', params.wallet);
  if (params.asset) sp.set('asset', params.asset);
  if (params.type) sp.set('type', params.type);
  const res = await apiClient<ApiResponse<GroupActivityPage>>(
    `${TRADER_GROUPS_BASE}/${id}/activity?${sp.toString()}`,
  );
  if (!res.data) throw new Error('No data returned');
  return res.data;
}
export async function getGroupAlerts(id: string): Promise<GroupAlert[]> {
  const res = await apiClient<ApiResponse<GroupAlert[]>>(`${TRADER_GROUPS_BASE}/${id}/alerts`);
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function createGroupAlert(
  id: string,
  input: {
    name: string;
    type: string;
    params?: Record<string, unknown>;
    enabled?: boolean;
    cooldown_seconds?: number;
    notify_in_app?: boolean;
    notify_telegram?: boolean;
  },
): Promise<GroupAlert> {
  const res = await apiClient<ApiResponse<GroupAlert>>(`${TRADER_GROUPS_BASE}/${id}/alerts`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function updateGroupAlert(
  alertId: string,
  input: Partial<{
    name: string;
    type: string;
    params: Record<string, unknown>;
    enabled: boolean;
    cooldown_seconds: number;
    notify_in_app: boolean;
    notify_telegram: boolean;
  }>,
): Promise<GroupAlert> {
  const res = await apiClient<ApiResponse<GroupAlert>>(
    `${TRADER_GROUPS_BASE.replace('trader-groups', 'trader-alerts')}/${alertId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function deleteGroupAlert(alertId: string): Promise<void> {
  await apiClient(`${TRADER_GROUPS_BASE.replace('trader-groups', 'trader-alerts')}/${alertId}`, {
    method: 'DELETE',
  });
}

export async function getGroupAlertEvents(
  id: string,
  params: { unread?: boolean; limit?: number; cursor?: string } = {},
): Promise<GroupAlertEventsPage> {
  const sp = new URLSearchParams();
  if (params.unread) sp.set('unread', 'true');
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.cursor) sp.set('cursor', params.cursor);
  const res = await apiClient<ApiResponse<GroupAlertEventsPage>>(
    `${TRADER_GROUPS_BASE}/${id}/alert-events?${sp.toString()}`,
  );
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function markGroupAlertEventRead(eventId: string): Promise<void> {
  await apiClient(
    `${TRADER_GROUPS_BASE.replace('trader-groups', 'trader-alert-events')}/${eventId}/read`,
    {
      method: 'POST',
    },
  );
}

export async function markAllGroupAlertEventsRead(id: string): Promise<void> {
  await apiClient(`${TRADER_GROUPS_BASE}/${id}/alert-events/read-all`, {
    method: 'POST',
  });
}

export async function getGroupAlertsUnreadCount(): Promise<number> {
  const res = await apiClient<ApiResponse<Record<string, unknown>>>(
    `/api/v1/trader-alerts/unread-count`,
  );
  const data = res.data ?? {};
  const v = data.count ?? data.unread_count ?? data.unread ?? data.total ?? 0;
  return typeof v === 'number' ? v : 0;
}

export async function getGroupsCompare(
  groupIds: string[],
  period: '1D' | '7D' | '30D' | '90D' | 'ALL' = '30D',
): Promise<GroupCompareResponse> {
  const res = await apiClient<ApiResponse<GroupCompareResponse>>(`${TRADER_GROUPS_BASE}/compare`, {
    method: 'POST',
    body: JSON.stringify({ group_ids: groupIds, period }),
  });
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function getTraderGroup(id: string): Promise<TraderGroup> {
  const res = await apiClient<ApiResponse<TraderGroup>>(`${TRADER_GROUPS_BASE}/${id}`);
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function createTraderGroup(input: {
  name: string;
  description?: string;
}): Promise<TraderGroup> {
  const res = await apiClient<ApiResponse<TraderGroup>>(TRADER_GROUPS_BASE, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function updateTraderGroup(
  id: string,
  input: { name?: string; description?: string; notify_enabled?: boolean; is_favorite?: boolean },
): Promise<TraderGroup> {
  const res = await apiClient<ApiResponse<TraderGroup>>(`${TRADER_GROUPS_BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function toggleGroupFavorite(
  id: string,
  isFavorite: boolean,
): Promise<{ id: string; is_favorite: boolean }> {
  const res = await apiClient<ApiResponse<{ id: string; is_favorite: boolean }>>(
    `${TRADER_GROUPS_BASE}/${id}/favorite`,
    {
      method: 'PATCH',
      body: JSON.stringify({ is_favorite: isFavorite }),
    },
  );
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function deleteTraderGroup(id: string): Promise<void> {
  await apiClient(`${TRADER_GROUPS_BASE}/${id}`, { method: 'DELETE' });
}

export async function listGroupMembers(
  groupId: string,
  period: TraderDetail['period'] = DEFAULT_TRADER_PERIOD,
): Promise<TraderMember[]> {
  const params = new URLSearchParams();
  params.set('period', period);
  const res = await apiClient<ApiResponse<TraderMember[]>>(
    `${TRADER_GROUPS_BASE}/${groupId}/members?${params.toString()}`,
  );
  return res.data ?? [];
}

export async function addGroupMembers(
  groupId: string,
  members: MemberInput[],
): Promise<{ added: number }> {
  const res = await apiClient<ApiResponse<{ added: number }>>(
    `${TRADER_GROUPS_BASE}/${groupId}/members`,
    { method: 'POST', body: JSON.stringify({ members }) },
  );
  return { added: typeof res.data?.added === 'number' ? res.data.added : 0 };
}

export async function removeGroupMembers(
  groupId: string,
  members: MemberInput[],
): Promise<{ removed: number }> {
  const res = await apiClient<ApiResponse<{ removed: number }>>(
    `${TRADER_GROUPS_BASE}/${groupId}/members`,
    { method: 'DELETE', body: JSON.stringify({ members }) },
  );
  return { removed: typeof res.data?.removed === 'number' ? res.data.removed : 0 };
}

export async function updateGroupMembers(
  groupId: string,
  members: MemberInput[],
): Promise<{ updated: number }> {
  const res = await apiClient<ApiResponse<{ updated: number }>>(
    `${TRADER_GROUPS_BASE}/${groupId}/members`,
    { method: 'PATCH', body: JSON.stringify({ members }) },
  );
  return { updated: typeof res.data?.updated === 'number' ? res.data.updated : 0 };
}

function normalizeBucketArgs(args: unknown[]): {
  kind: string;
  id: string;
  params: Record<string, unknown>;
} {
  let kind = '';
  let id = '';
  let params: Record<string, unknown> = {};
  if (typeof args[0] === 'string') {
    kind = args[0];
    if (typeof args[1] === 'string') {
      id = args[1];
      params = args[2] && typeof args[2] === 'object' ? (args[2] as Record<string, unknown>) : {};
    } else {
      params = args[1] && typeof args[1] === 'object' ? (args[1] as Record<string, unknown>) : {};
    }
  } else {
    params = args[0] && typeof args[0] === 'object' ? (args[0] as Record<string, unknown>) : {};
    kind = String(params.kind ?? params.bucketKind ?? '');
    id = String(
      params.bucket ?? params.id ?? params.bucketId ?? params.bucket_id ?? params.bucketID ?? '',
    );
  }
  if (!id && params.bucket) id = String(params.bucket);
  return { kind: String(kind ?? '').toLowerCase(), id: String(id ?? ''), params };
}

export async function fetchBucketDetail(...args: unknown[]): Promise<BucketDetail> {
  const { kind, id, params } = normalizeBucketArgs(args);
  const venue = (params.venue as string) ?? DEFAULT_VENUE;
  const period = (params.period as string) ?? DEFAULT_TRADER_PERIOD;
  const range = (params.range as string) ?? '30D';
  const search = new URLSearchParams();
  search.set('venue', venue);
  search.set('period', String(period).toUpperCase());
  search.set('range', String(range).toUpperCase());
  const res = await apiClient<ApiResponse<BucketDetail>>(
    `${TRADERS_BASE}/overview/buckets/${kind}/${id}?${search.toString()}`,
    { signal: params.signal as AbortSignal, timeout: 60000 },
  );
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function fetchBucketWallets(
  ...args: unknown[]
): Promise<{ data: BucketWalletRow[]; meta: Meta }> {
  const { kind, id, params } = normalizeBucketArgs(args);
  const venue = (params.venue as string) ?? DEFAULT_VENUE;
  const period = (params.period as string) ?? DEFAULT_TRADER_PERIOD;
  const sort = (params.sort as string) ?? 'equity';
  const dir = (params.dir as string) ?? 'desc';
  const page = (params.page as number) ?? 1;
  const limit = (params.limit as number) ?? 20;
  const search = new URLSearchParams();
  search.set('venue', venue);
  search.set('period', String(period).toUpperCase());
  search.set('sort', sort);
  search.set('dir', dir);
  search.set('page', String(page));
  search.set('limit', String(limit));
  const res = await apiClient<ApiResponse<BucketWalletRow[]>>(
    `${TRADERS_BASE}/overview/buckets/${kind}/${id}/wallets?${search.toString()}`,
    { signal: params.signal as AbortSignal },
  );
  if (!res.data) throw new Error('No data returned');
  return { data: res.data, meta: res.meta || {} };
}

export async function fetchBucketMarkets(
  ...args: unknown[]
): Promise<{ data: BucketMarketRow[]; meta: Meta }> {
  const { kind, id, params } = normalizeBucketArgs(args);
  const venue = (params.venue as string) ?? DEFAULT_VENUE;
  const period = (params.period as string) ?? DEFAULT_TRADER_PERIOD;
  const range = (params.range as string) ?? '30D';
  const search = (params.search as string) ?? (params.q as string) ?? '';
  const sort = (params.sort as string) ?? 'notional';
  const dir = (params.dir as string) ?? 'desc';
  const page = (params.page as number) ?? 1;
  const limit = (params.limit as number) ?? 20;
  const qs = new URLSearchParams();
  qs.set('venue', venue);
  qs.set('period', String(period).toUpperCase());
  qs.set('range', String(range).toUpperCase());
  if (search) qs.set('search', search);
  qs.set('sort', sort);
  qs.set('dir', dir);
  qs.set('page', String(page));
  qs.set('limit', String(limit));
  const res = await apiClient<ApiResponse<BucketMarketRow[]>>(
    `${TRADERS_BASE}/overview/buckets/${kind}/${id}/markets?${qs.toString()}`,
    { signal: params.signal as AbortSignal },
  );
  if (!res.data) throw new Error('No data returned');
  return { data: res.data, meta: res.meta || {} };
}

export async function fetchMarketDetail(
  market: string,
  params: {
    venue?: string;
    from?: string;
    to?: string;
    signal?: AbortSignal;
  } = {},
  options: { signal?: AbortSignal } = {},
): Promise<MarketDetailResponse> {
  const search = new URLSearchParams();
  search.set('venue', params.venue ?? DEFAULT_VENUE);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  const res = await apiClient<ApiResponse<MarketDetailResponse>>(
    `${TRADERS_BASE}/markets/${encodeURIComponent(market)}?${search.toString()}`,
    { signal: params.signal ?? options.signal },
  );
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function fetchMarketWallets(
  market: string,
  params: {
    venue?: string;
    from?: string;
    to?: string;
    win_rate_min?: number;
    trades_min?: number;
    last_trade_after?: string;
    groups?: string;
    sort?: string;
    dir?: string;
    page?: number;
    limit?: number;
    signal?: AbortSignal;
  } = {},
  options: { signal?: AbortSignal } = {},
): Promise<{ data: MarketWalletRow[]; meta: Meta }> {
  const search = new URLSearchParams();
  search.set('venue', params.venue ?? DEFAULT_VENUE);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  if (params.win_rate_min !== undefined) search.set('win_rate_min', String(params.win_rate_min));
  if (params.trades_min !== undefined) search.set('trades_min', String(params.trades_min));
  if (params.last_trade_after) search.set('last_trade_after', params.last_trade_after);
  if (params.groups) search.set('groups', params.groups);
  search.set('sort', params.sort ?? 'volume');
  search.set('dir', params.dir ?? 'desc');
  search.set('page', String(params.page ?? 1));
  search.set('limit', String(params.limit ?? 20));
  const res = await apiClient<ApiResponse<MarketWalletRow[]>>(
    `${TRADERS_BASE}/markets/${encodeURIComponent(market)}/wallets?${search.toString()}`,
    { signal: params.signal ?? options.signal },
  );
  return { data: res.data ?? [], meta: res.meta || {} };
}

export async function fetchMarketTrades(
  market: string,
  params: {
    venue?: string;
    from?: string;
    to?: string;
    side?: string;
    page?: number;
    limit?: number;
    signal?: AbortSignal;
  } = {},
  options: { signal?: AbortSignal } = {},
): Promise<{ data: MarketTradeRow[]; meta: Meta }> {
  const search = new URLSearchParams();
  search.set('venue', params.venue ?? DEFAULT_VENUE);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  if (params.side) search.set('side', params.side);
  search.set('page', String(params.page ?? 1));
  search.set('limit', String(params.limit ?? 20));
  const res = await apiClient<ApiResponse<MarketTradeRow[]>>(
    `${TRADERS_BASE}/markets/${encodeURIComponent(market)}/trades?${search.toString()}`,
    { signal: params.signal ?? options.signal },
  );
  return { data: res.data ?? [], meta: res.meta || {} };
}

// Admin watched markets CRUD
export async function listWatchedMarkets(
  options: { signal?: AbortSignal } = {},
): Promise<WatchedMarket[]> {
  const res = await apiClient<ApiResponse<WatchedMarket[]>>(
    `${TRADERS_BASE.replace('/traders', '/admin/traders')}/markets`,
    { signal: options.signal },
  );
  return res.data ?? [];
}

export async function fetchWatchedMarkets(
  options: { signal?: AbortSignal } = {},
): Promise<WatchedMarket[]> {
  return listWatchedMarkets(options);
}

export async function createWatchedMarket(
  input: {
    venue?: string;
    market: string;
    enabled?: boolean;
    sort_order?: number;
    sortOrder?: number;
  },
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  await apiClient(`${TRADERS_BASE.replace('/traders', '/admin/traders')}/markets`, {
    method: 'POST',
    body: JSON.stringify({
      venue: input.venue ?? DEFAULT_VENUE,
      market: input.market,
      enabled: input.enabled ?? true,
      sort_order: input.sort_order ?? input.sortOrder ?? 0,
    }),
    signal: options.signal,
  });
}

export async function updateWatchedMarket(
  market: string,
  input: { venue?: string; enabled?: boolean; sort_order?: number; sortOrder?: number },
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  const search = new URLSearchParams();
  search.set('venue', input.venue ?? DEFAULT_VENUE);
  await apiClient(
    `${TRADERS_BASE.replace('/traders', '/admin/traders')}/markets/${encodeURIComponent(market)}?${search.toString()}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        enabled: input.enabled,
        sort_order: input.sort_order ?? input.sortOrder,
      }),
      signal: options.signal,
    },
  );
}

export async function deleteWatchedMarket(
  market: string,
  params: { venue?: string } = {},
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  const search = new URLSearchParams();
  search.set('venue', params.venue ?? DEFAULT_VENUE);
  await apiClient(
    `${TRADERS_BASE.replace('/traders', '/admin/traders')}/markets/${encodeURIComponent(market)}?${search.toString()}`,
    { method: 'DELETE', signal: options.signal },
  );
}
