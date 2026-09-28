import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '@/infrastructure/api-client';
import { listGroups, getGroup, createGroup, updateGroup, deleteGroup } from '@/services/groups';

vi.mock('@/infrastructure/api-client', () => ({
  apiClient: vi.fn(),
}));

const mockGroup = {
  id: 'g1',
  name: 'Main',
  description: 'desc',
  color: '#fff',
  wallet_count: 2,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('groups service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('listGroups calls GET /api/v1/groups', async () => {
    vi.mocked(apiClient.apiClient).mockResolvedValue({ success: true, data: [mockGroup] });
    const result = await listGroups();
    expect(apiClient.apiClient).toHaveBeenCalledWith('/api/v1/groups');
    expect(result).toEqual([mockGroup]);
  });

  it('listGroups throws when no data', async () => {
    vi.mocked(apiClient.apiClient).mockResolvedValue({ success: true });
    await expect(listGroups()).rejects.toThrow('No data returned');
  });

  it('getGroup calls GET /api/v1/groups/{id}', async () => {
    vi.mocked(apiClient.apiClient).mockResolvedValue({ success: true, data: mockGroup });
    const result = await getGroup('g1');
    expect(apiClient.apiClient).toHaveBeenCalledWith('/api/v1/groups/g1');
    expect(result).toEqual(mockGroup);
  });

  it('createGroup trims name and POSTs', async () => {
    vi.mocked(apiClient.apiClient).mockResolvedValue({ success: true, data: mockGroup });
    await createGroup({ name: '  Main  ', description: 'd' });
    expect(apiClient.apiClient).toHaveBeenCalledWith(
      '/api/v1/groups',
      expect.objectContaining({ method: 'POST' }),
    );
    const body = JSON.parse(vi.mocked(apiClient.apiClient).mock.calls[0][1]?.body as string);
    expect(body.name).toBe('Main');
  });

  it('createGroup rejects blank name without calling API', async () => {
    await expect(createGroup({ name: '   ' })).rejects.toThrow('Group name is required');
    expect(apiClient.apiClient).not.toHaveBeenCalled();
  });

  it('createGroup throws when no data', async () => {
    vi.mocked(apiClient.apiClient).mockResolvedValue({ success: true });
    await expect(createGroup({ name: 'Main' })).rejects.toThrow('No data returned');
  });

  it('updateGroup PATCHes trimmed name', async () => {
    vi.mocked(apiClient.apiClient).mockResolvedValue({ success: true, data: mockGroup });
    await updateGroup('g1', { name: '  New  ' });
    expect(apiClient.apiClient).toHaveBeenCalledWith(
      '/api/v1/groups/g1',
      expect.objectContaining({ method: 'PATCH' }),
    );
    const body = JSON.parse(vi.mocked(apiClient.apiClient).mock.calls[0][1]?.body as string);
    expect(body.name).toBe('New');
  });

  it('updateGroup throws when no data', async () => {
    vi.mocked(apiClient.apiClient).mockResolvedValue({ success: true });
    await expect(updateGroup('g1', { name: 'New' })).rejects.toThrow('No data returned');
  });

  it('deleteGroup calls DELETE', async () => {
    vi.mocked(apiClient.apiClient).mockResolvedValue({});
    await deleteGroup('g1');
    expect(apiClient.apiClient).toHaveBeenCalledWith(
      '/api/v1/groups/g1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('propagates API errors', async () => {
    vi.mocked(apiClient.apiClient).mockRejectedValue(new Error('Network error'));
    await expect(listGroups()).rejects.toThrow('Network error');
  });
});
