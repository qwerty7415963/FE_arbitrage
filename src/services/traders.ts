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
  type TraderGroup,
  type TraderMember,
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
  if (!res.data) throw new Error('No data returned');
  return { data: res.data, meta: res.meta || {} };
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
    { signal: options.signal },
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
  const res = await apiClient<ApiResponse<PerformanceSnapshot>>(
    `${TRADERS_BASE}/${walletAddress}/performance?${params.toString()}`,
    { signal: options.signal },
  );
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function listTraderGroups(): Promise<TraderGroup[]> {
  const res = await apiClient<ApiResponse<TraderGroup[]>>(TRADER_GROUPS_BASE);
  return res.data ?? [];
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
  input: { name?: string; description?: string },
): Promise<TraderGroup> {
  const res = await apiClient<ApiResponse<TraderGroup>>(`${TRADER_GROUPS_BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
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
