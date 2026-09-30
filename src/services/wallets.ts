import { apiClient } from '@/infrastructure/api-client';
import type { ApiResponse } from '@/types/api';
import type {
  AddWalletsResult,
  GroupWallet,
  GroupWalletMeta,
  GroupWalletQuery,
  Wallet,
} from '@/types/wallet-scan';

const WALLETS_BASE = '/api/v1/wallets';

export function buildWalletQueryParams(query: GroupWalletQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.search?.trim()) params.set('search', query.search.trim());
  if (query.dex?.length) params.set('dex', query.dex.join(','));
  if (query.chain?.length) params.set('chain', query.chain.join(','));
  if (query.market?.length) params.set('market', query.market.join(','));
  if (query.timeframe) params.set('timeframe', query.timeframe);
  if (query.start) params.set('start', query.start);
  if (query.end) params.set('end', query.end);
  for (const f of query.filters ?? []) {
    if (f.operator === 'between') {
      if (f.min !== undefined && f.max !== undefined) {
        params.set(`${f.metric}_between`, `${f.min},${f.max}`);
      }
    } else if (f.value !== undefined) {
      params.set(`${f.metric}_${f.operator}`, String(f.value));
    }
  }
  if (query.lastActiveWithin?.trim())
    params.set('last_active_within', query.lastActiveWithin.trim());
  if (query.lastActiveFrom) params.set('last_active_from', query.lastActiveFrom);
  if (query.lastActiveTo) params.set('last_active_to', query.lastActiveTo);
  if (query.sort) params.set('sort', query.sort);
  if (query.order) params.set('order', query.order);
  params.set('page', String(query.page ?? 1));
  params.set('limit', String(query.limit ?? 50));
  return params;
}

export async function scanWallets(
  query: GroupWalletQuery = {},
): Promise<{ data: Wallet[]; meta: GroupWalletMeta }> {
  const params = buildWalletQueryParams(query);
  const res = await apiClient<ApiResponse<Wallet[]>>(`${WALLETS_BASE}?${params.toString()}`);
  if (!res.data) throw new Error('No data returned');
  return { data: res.data, meta: res.meta || {} };
}

export async function addWalletsToGroup(
  groupId: string,
  wallets: string[],
): Promise<AddWalletsResult> {
  const res = await apiClient<ApiResponse<AddWalletsResult>>(`/api/v1/groups/${groupId}/wallets`, {
    method: 'POST',
    body: JSON.stringify({ wallets }),
  });
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function removeWalletsFromGroup(groupId: string, wallets: string[]): Promise<void> {
  await apiClient(`/api/v1/groups/${groupId}/wallets`, {
    method: 'DELETE',
    body: JSON.stringify({ wallets }),
  });
}

export type { GroupWallet, GroupWalletQuery, GroupWalletMeta };
