import { apiClient } from '@/infrastructure/api-client';
import type { ApiResponse } from '@/types/api';
import type { CreateGroupRequest, Group, UpdateGroupRequest } from '@/types/wallet-group';
import type { GroupWallet, GroupWalletMeta, GroupWalletQuery } from '@/types/wallet-scan';
import { buildWalletQueryParams } from '@/services/wallets';

const GROUPS_BASE = '/api/v1/groups';

export async function listGroups(): Promise<Group[]> {
  const res = await apiClient<ApiResponse<Group[]>>(GROUPS_BASE);
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function getGroup(id: string): Promise<Group> {
  const res = await apiClient<ApiResponse<Group>>(`${GROUPS_BASE}/${id}`);
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function createGroup(input: CreateGroupRequest): Promise<Group> {
  const name = input.name.trim();
  if (!name) {
    throw new Error('Group name is required');
  }
  const res = await apiClient<ApiResponse<Group>>(GROUPS_BASE, {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      name,
    }),
  });
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function updateGroup(id: string, input: UpdateGroupRequest): Promise<Group> {
  const body: UpdateGroupRequest = { ...input };
  if (body.name !== undefined) {
    body.name = body.name.trim();
  }
  const res = await apiClient<ApiResponse<Group>>(`${GROUPS_BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!res.data) throw new Error('No data returned');
  return res.data;
}

export async function deleteGroup(id: string): Promise<void> {
  await apiClient(`${GROUPS_BASE}/${id}`, { method: 'DELETE' });
}

export function buildGroupWalletParams(query: GroupWalletQuery): URLSearchParams {
  const params = buildWalletQueryParams(query);
  params.set('include', 'metrics');
  return params;
}

export async function listGroupWallets(
  groupId: string,
  query: GroupWalletQuery = {},
): Promise<{ data: GroupWallet[]; meta: GroupWalletMeta }> {
  const params = buildGroupWalletParams(query);
  const res = await apiClient<ApiResponse<GroupWallet[]>>(
    `${GROUPS_BASE}/${groupId}/wallets?${params.toString()}`,
  );
  if (!res.data) throw new Error('No data returned');
  return { data: res.data, meta: res.meta || {} };
}
