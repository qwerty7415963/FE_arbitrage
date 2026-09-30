import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '@/infrastructure/api-client';
import {
  listGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  listGroupWallets,
  buildGroupWalletParams,
} from '@/services/groups';

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

  describe('buildGroupWalletParams', () => {
    it('always includes metrics + page + limit defaults', () => {
      const params = buildGroupWalletParams({});
      expect(params.get('include')).toBe('metrics');
      expect(params.get('page')).toBe('1');
      expect(params.get('limit')).toBe('50');
    });

    it('joins dex/chain/market as csv', () => {
      const params = buildGroupWalletParams({ dex: ['hyperliquid', 'extended'], chain: ['evm'] });
      expect(params.get('dex')).toBe('hyperliquid,extended');
      expect(params.get('chain')).toBe('evm');
      expect(params.get('market')).toBeNull();
    });

    it('maps single-operator filters to metric_operator params', () => {
      const params = buildGroupWalletParams({
        filters: [{ metric: 'pnl', operator: 'gt', value: 100 }],
      });
      expect(params.get('pnl_gt')).toBe('100');
    });

    it('maps between filters to lo,hi string', () => {
      const params = buildGroupWalletParams({
        filters: [{ metric: 'roi', operator: 'between', min: 1, max: 5 }],
      });
      expect(params.get('roi_between')).toBe('1,5');
    });

    it('skips incomplete filters', () => {
      const params = buildGroupWalletParams({
        filters: [
          { metric: 'pnl', operator: 'gt' },
          { metric: 'roi', operator: 'between', min: 1 },
        ],
      });
      expect(params.get('pnl_gt')).toBeNull();
      expect(params.get('roi_between')).toBeNull();
    });

    it('includes sort/order/timeframe/search', () => {
      const params = buildGroupWalletParams({
        search: ' 0xabc ',
        timeframe: '7D',
        sort: 'roi',
        order: 'asc',
      });
      expect(params.get('search')).toBe('0xabc');
      expect(params.get('timeframe')).toBe('7D');
      expect(params.get('sort')).toBe('roi');
      expect(params.get('order')).toBe('asc');
    });
  });

  describe('listGroupWallets', () => {
    it('calls endpoint with query string and returns data + meta', async () => {
      const wallets = [{ id: 'w1' }];
      const meta = { page: 1, total_pages: 3 };
      vi.mocked(apiClient.apiClient).mockResolvedValue({ success: true, data: wallets, meta });
      const result = await listGroupWallets('g1', { sort: 'pnl' });
      const url = vi.mocked(apiClient.apiClient).mock.calls[0][0] as string;
      expect(url).toContain('/api/v1/groups/g1/wallets');
      expect(url).toContain('include=metrics');
      expect(url).toContain('sort=pnl');
      expect(result.data).toEqual(wallets);
      expect(result.meta).toEqual(meta);
    });

    it('throws when no data returned', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValue({ success: true });
      await expect(listGroupWallets('g1')).rejects.toThrow('No data returned');
    });
  });
});
