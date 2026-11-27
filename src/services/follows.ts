import { apiClient } from '@/infrastructure/api-client';
import type { ApiResponse, Meta } from '@/types/api';
import type {
  FollowedWallet,
  FollowFilter,
  FollowKey,
  FollowOverview,
  FollowStatus,
  MemberInput,
} from '@/types/trader';

const BASE = '/api/v1/trader-follows';

export async function listFollowedWallets(
  params: {
    period?: string;
    search?: string;
    sort?: string;
    dir?: 'asc' | 'desc';
    page?: number;
    page_size?: number;
    filter?: FollowFilter;
  } = {},
): Promise<{ items: FollowedWallet[]; meta: Meta; as_of: string }> {
  const sp = new URLSearchParams();
  if (params.period) sp.set('period', params.period);
  if (params.search) sp.set('search', params.search);
  if (params.sort) sp.set('sort', params.sort);
  if (params.dir) sp.set('dir', params.dir);
  if (params.page) sp.set('page', String(params.page));
  if (params.page_size) sp.set('page_size', String(params.page_size));
  if (params.filter) sp.set('filter', params.filter);
  const res = await apiClient<{
    success: boolean;
    data?: FollowedWallet[];
    meta?: Meta;
    as_of?: string;
  }>(`${BASE}?${sp.toString()}`);
  return {
    items: res.data ?? [],
    meta: res.meta ?? { total: 0, page: 1, total_pages: 1, limit: params.page_size ?? 20 },
    as_of: res.as_of ?? '',
  };
}

export async function getFollowKeys(): Promise<FollowKey[]> {
  const res = await apiClient<ApiResponse<FollowKey[]>>(`${BASE}/keys`);
  return res.data ?? [];
}

export async function getFollowOverview(period = '30D'): Promise<FollowOverview> {
  const res = await apiClient<ApiResponse<FollowOverview>>(`${BASE}/overview?period=${period}`);
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function followWallets(
  wallets: MemberInput[],
  notifyEnabled?: boolean,
): Promise<{ followed: number; skipped: number }> {
  const body: { wallets: MemberInput[]; notify_enabled?: boolean } = { wallets };
  if (notifyEnabled !== undefined) body.notify_enabled = notifyEnabled;
  const res = await apiClient<ApiResponse<{ followed: number; skipped: number }>>(BASE, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return { followed: res.data?.followed ?? 0, skipped: res.data?.skipped ?? 0 };
}

export async function unfollowWallets(wallets: MemberInput[]): Promise<{ unfollowed: number }> {
  const res = await apiClient<ApiResponse<{ unfollowed: number }>>(BASE, {
    method: 'DELETE',
    body: JSON.stringify({ wallets }),
  });
  return { unfollowed: res.data?.unfollowed ?? 0 };
}

export async function getFollowStatus(venue: string, wallet: string): Promise<FollowStatus> {
  const res = await apiClient<ApiResponse<FollowStatus>>(
    `${BASE}/${encodeURIComponent(venue)}/${encodeURIComponent(wallet)}`,
  );
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function followWallet(
  venue: string,
  wallet: string,
  notifyEnabled?: boolean,
): Promise<{ followed: number; skipped: number }> {
  const res = await apiClient<ApiResponse<{ followed: number; skipped: number }>>(
    `${BASE}/${encodeURIComponent(venue)}/${encodeURIComponent(wallet)}`,
    {
      method: 'PUT',
      body: JSON.stringify(notifyEnabled === undefined ? {} : { notify_enabled: notifyEnabled }),
    },
  );
  return { followed: res.data?.followed ?? 0, skipped: res.data?.skipped ?? 0 };
}

export async function unfollowWallet(
  venue: string,
  wallet: string,
): Promise<{ unfollowed: number }> {
  const res = await apiClient<ApiResponse<{ unfollowed: number }>>(
    `${BASE}/${encodeURIComponent(venue)}/${encodeURIComponent(wallet)}`,
    { method: 'DELETE' },
  );
  return { unfollowed: res.data?.unfollowed ?? 0 };
}

export async function updateFollowPreferences(
  venue: string,
  address: string,
  input: { notify_enabled?: boolean; alias?: string },
): Promise<void> {
  await apiClient(
    `${BASE}/${encodeURIComponent(venue)}/${encodeURIComponent(address)}/preferences`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}

export async function setFollowNotify(
  venue: string,
  address: string,
  notifyEnabled: boolean,
): Promise<void> {
  await updateFollowPreferences(venue, address, { notify_enabled: notifyEnabled });
}
