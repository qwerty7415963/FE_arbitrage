import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '@/infrastructure/api-client';
import {
  addGroupMembers,
  buildTraderSearchRequest,
  createTraderGroup,
  deleteTraderGroup,
  fetchTraderDetail,
  listGroupMembers,
  listTraderGroups,
  removeGroupMembers,
  searchTraders,
  updateTraderGroup,
} from '@/services/traders';

vi.mock('@/infrastructure/api-client', () => ({
  apiClient: vi.fn(),
}));

describe('traders service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('buildTraderSearchRequest', () => {
    it('maps range filters to snake_case and omits undefined', () => {
      expect(
        buildTraderSearchRequest({
          venue: ' hyperliquid ',
          period: '7D',
          roi: { min: 30 },
          winRate: { min: 60, max: 100 },
          tradeCount: { min: 10 },
          sortBy: 'roi',
          sortDirection: 'asc',
          limit: 20,
          cursor: 'c1',
        }),
      ).toEqual({
        venue: 'hyperliquid',
        period: '7D',
        roi_min: 30,
        win_rate_min: 60,
        win_rate_max: 100,
        trade_count_min: 10,
        sort_by: 'roi',
        sort_direction: 'asc',
        limit: 20,
        cursor: 'c1',
      });
    });

    it('returns an empty body for an empty query', () => {
      expect(buildTraderSearchRequest({})).toEqual({});
    });
  });

  describe('searchTraders', () => {
    it('POSTs to /api/v1/traders/search with merged defaults', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValue({
        success: true,
        data: [{ wallet_address: '0x1' }],
        meta: { has_more: true, cursor: 'next' },
      });
      const result = await searchTraders({ roi: { min: 30 } });
      const [url, options] = vi.mocked(apiClient.apiClient).mock.calls[0] as [string, RequestInit];
      expect(url).toBe('/api/v1/traders/search');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body as string)).toEqual({
        venue: 'hyperliquid',
        period: '30D',
        roi_min: 30,
        sort_by: 'pnl',
        sort_direction: 'desc',
        limit: 50,
      });
      expect(result.meta).toEqual({ has_more: true, cursor: 'next' });
    });

    it('throws when no data returned', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValue({ success: true });
      await expect(searchTraders()).rejects.toThrow('No data returned');
    });
  });

  describe('fetchTraderDetail', () => {
    it('GETs /api/v1/traders/{wallet} with venue and period', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValue({
        success: true,
        data: { period: '7D' },
      });
      const detail = await fetchTraderDetail('0xabc', { period: '7D' });
      expect(vi.mocked(apiClient.apiClient).mock.calls[0][0]).toBe(
        '/api/v1/traders/0xabc?venue=hyperliquid&period=7D',
      );
      expect(detail).toEqual({ period: '7D' });
    });
  });

  describe('trader-groups', () => {
    it('lists, creates, updates and deletes groups', async () => {
      vi.mocked(apiClient.apiClient)
        .mockResolvedValueOnce({ success: true, data: [{ id: 'g1' }] })
        .mockResolvedValueOnce({ success: true, data: { id: 'g1' } })
        .mockResolvedValueOnce({ success: true, data: { id: 'g1', name: 'New' } })
        .mockResolvedValueOnce({});
      expect(await listTraderGroups()).toEqual([{ id: 'g1' }]);
      expect(await createTraderGroup({ name: 'Main' })).toEqual({ id: 'g1' });
      expect(await updateTraderGroup('g1', { name: 'New' })).toEqual({ id: 'g1', name: 'New' });
      await deleteTraderGroup('g1');
      expect(vi.mocked(apiClient.apiClient).mock.calls[3][1]).toMatchObject({
        method: 'DELETE',
      });
    });

    it('manages members with added/removed counts', async () => {
      vi.mocked(apiClient.apiClient)
        .mockResolvedValueOnce({ success: true, data: [] })
        .mockResolvedValueOnce({ success: true, data: { added: 2 } })
        .mockResolvedValueOnce({ success: true, data: { removed: 1 } })
        .mockResolvedValueOnce({ success: true });
      expect(await listGroupMembers('g1')).toEqual([]);
      const members = [{ venue: 'hyperliquid', wallet_address: '0x1' }];
      expect(await addGroupMembers('g1', members)).toEqual({ added: 2 });
      expect(await removeGroupMembers('g1', members)).toEqual({ removed: 1 });
      expect(await addGroupMembers('g1', members)).toEqual({ added: 0 });
    });
  });
});
