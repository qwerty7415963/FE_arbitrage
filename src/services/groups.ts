import { apiClient } from '@/infrastructure/api-client';
import type { ApiResponse } from '@/types/api';
import type { CreateGroupRequest, Group, UpdateGroupRequest } from '@/types/wallet-group';

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
