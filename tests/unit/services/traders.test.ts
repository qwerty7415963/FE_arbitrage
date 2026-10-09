import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '@/infrastructure/api-client';
import {
  addGroupMembers,
  buildTraderSearchRequest,
  createTraderGroup,
  deleteTraderGroup,
  fetchTraderActivity,
  fetchTraderBalances,
  fetchTraderDetail,
  fetchTraderFills,
  fetchTraderOrders,
  fetchTraderPerformance,
  fetchTraderPositions,
  fetchTraderTransfers,
  getTraderGroup,
  listGroupMembers,
  listTraderGroups,
  removeGroupMembers,
  searchTraders,
  triggerTraderSync,
  updateGroupMembers,
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
          page: 2,
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
        page: 2,
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
        meta: { page: 1, total: 1, total_pages: 1 },
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
        page: 1,
      });
      expect(result.meta).toEqual({ page: 1, total: 1, total_pages: 1 });
    });

    it('sends the requested page', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValue({
        success: true,
        data: [],
        meta: { page: 2, total: 40, total_pages: 2 },
      });
      await searchTraders({ page: 2 });
      const [, options] = vi.mocked(apiClient.apiClient).mock.calls[0] as [string, RequestInit];
      expect(JSON.parse(options.body as string)).toMatchObject({ page: 2 });
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

  describe('fetchTraderPositions', () => {
    it('GETs positions with default venue', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({
        success: true,
        data: { summary: null, positions: [], data_status: 'ready', as_of: null },
      });
      const snap = await fetchTraderPositions('0xabc');
      expect(vi.mocked(apiClient.apiClient).mock.calls[0][0]).toBe(
        '/api/v1/traders/0xabc/positions?venue=hyperliquid',
      );
      expect(snap.positions).toEqual([]);
    });

    it('throws when no data returned', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({ success: true });
      await expect(fetchTraderPositions('0xabc')).rejects.toThrow('No data returned');
    });
  });

  describe('fetchTraderActivity', () => {
    it('GETs activity with default limit 20', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({
        success: true,
        data: { rows: [], next_cursor: null, has_more: false },
      });
      const page = await fetchTraderActivity('0xabc');
      expect(vi.mocked(apiClient.apiClient).mock.calls[0][0]).toBe(
        '/api/v1/traders/0xabc/activity?venue=hyperliquid&limit=20',
      );
      expect(page.rows).toEqual([]);
    });

    it('forwards limit and cursor params', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({
        success: true,
        data: { rows: [], next_cursor: 'c2', has_more: true },
      });
      const page = await fetchTraderActivity('0xabc', { limit: 5, cursor: 'c1' });
      expect(vi.mocked(apiClient.apiClient).mock.calls[0][0]).toContain('limit=5');
      expect(vi.mocked(apiClient.apiClient).mock.calls[0][0]).toContain('cursor=c1');
      expect(page.has_more).toBe(true);
    });

    it('throws when no data returned', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({ success: true });
      await expect(fetchTraderActivity('0xabc')).rejects.toThrow('No data returned');
    });

    it('forwards server-side sort, dir, result and side filters', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({
        success: true,
        data: {
          rows: [],
          next_cursor: null,
          has_more: false,
          counts: { win: 1, loss: 0, long: 1, short: 0, total: 1 },
        },
      });
      const page = await fetchTraderActivity('0xabc', {
        sort: 'net_pnl',
        dir: 'asc',
        result: 'win',
        side: 'long',
        limit: 5,
      });
      const url = vi.mocked(apiClient.apiClient).mock.calls[0][0] as string;
      expect(url).toContain('sort=net_pnl');
      expect(url).toContain('dir=asc');
      expect(url).toContain('result=win');
      expect(url).toContain('side=long');
      expect(url).toContain('limit=5');
      expect(page.counts).toEqual({ win: 1, loss: 0, long: 1, short: 0, total: 1 });
    });
  });

  describe('fetchTraderPositions sort', () => {
    it('forwards sort and dir params', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({
        success: true,
        data: { summary: null, positions: [], data_status: 'ready', as_of: null },
      });
      await fetchTraderPositions('0xabc', { sort: 'unrealized_pnl', dir: 'desc' });
      const url = vi.mocked(apiClient.apiClient).mock.calls[0][0] as string;
      expect(url).toContain('sort=unrealized_pnl');
      expect(url).toContain('dir=desc');
    });

    it('omits sort params by default', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({
        success: true,
        data: { summary: null, positions: [], data_status: 'ready', as_of: null },
      });
      await fetchTraderPositions('0xabc');
      expect(vi.mocked(apiClient.apiClient).mock.calls[0][0]).toBe(
        '/api/v1/traders/0xabc/positions?venue=hyperliquid',
      );
    });
  });

  describe('wallet tabs endpoints (contract v1)', () => {
    it('fetchTraderBalances GETs balances', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({
        success: true,
        data: { perp: null, spot: null, data_status: 'syncing' },
      });
      const snap = await fetchTraderBalances('0xabc');
      expect(vi.mocked(apiClient.apiClient).mock.calls[0][0]).toBe(
        '/api/v1/traders/0xabc/balances?venue=hyperliquid',
      );
      expect(snap.data_status).toBe('syncing');
    });

    it('fetchTraderBalances throws when no data returned', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({ success: true });
      await expect(fetchTraderBalances('0xabc')).rejects.toThrow('No data returned');
    });

    it('fetchTraderFills defaults to limit 100 and forwards cursor', async () => {
      vi.mocked(apiClient.apiClient)
        .mockResolvedValueOnce({
          success: true,
          data: { rows: [], next_cursor: null, has_more: false },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { rows: [], next_cursor: null, has_more: false },
        });
      await fetchTraderFills('0xabc');
      expect(vi.mocked(apiClient.apiClient).mock.calls[0][0]).toContain('limit=100');
      await fetchTraderFills('0xabc', { limit: 5, cursor: 't1' });
      const url = vi.mocked(apiClient.apiClient).mock.calls[1][0] as string;
      expect(url).toContain('limit=5');
      expect(url).toContain('cursor=t1');
    });

    it('fetchTraderFills throws when no data returned', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({ success: true });
      await expect(fetchTraderFills('0xabc')).rejects.toThrow('No data returned');
    });

    it('fetchTraderOrders defaults to open and maps historical status fields', async () => {
      vi.mocked(apiClient.apiClient)
        .mockResolvedValueOnce({ success: true, data: { status: 'open', rows: [] } })
        .mockResolvedValueOnce({
          success: true,
          data: {
            status: 'historical',
            rows: [{ order_status: 'filled', status_timestamp: '2026-10-08T00:00:00Z' }],
          },
        });
      const open = await fetchTraderOrders('0xabc');
      expect(vi.mocked(apiClient.apiClient).mock.calls[0][0]).toContain('status=open');
      expect(vi.mocked(apiClient.apiClient).mock.calls[0][0]).toContain('limit=200');
      expect(open.rows).toEqual([]);
      const historical = await fetchTraderOrders('0xabc', { status: 'historical' });
      expect(vi.mocked(apiClient.apiClient).mock.calls[1][0]).toContain('status=historical');
      expect(historical.rows[0].order_status).toBe('filled');
    });

    it('fetchTraderOrders throws when no data returned', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({ success: true });
      await expect(fetchTraderOrders('0xabc')).rejects.toThrow('No data returned');
    });

    it('fetchTraderTransfers defaults to 30 days and forwards cursor', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({
        success: true,
        data: { rows: [], next_cursor: null, has_more: false },
      });
      await fetchTraderTransfers('0xabc');
      const url = vi.mocked(apiClient.apiClient).mock.calls[0][0] as string;
      expect(url).toContain('days=30');
      expect(url).toContain('limit=200');
    });

    it('fetchTraderTransfers throws when no data returned', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({ success: true });
      await expect(fetchTraderTransfers('0xabc')).rejects.toThrow('No data returned');
    });

    it('fetchTraderPerformance defaults to 30D and forwards period', async () => {
      vi.mocked(apiClient.apiClient)
        .mockResolvedValueOnce({
          success: true,
          data: { period: '30D', metrics: null, equity: [] },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { period: '7D', metrics: null, equity: [] },
        });
      const monthly = await fetchTraderPerformance('0xabc');
      expect(vi.mocked(apiClient.apiClient).mock.calls[0][0]).toContain('period=30D');
      expect(monthly.period).toBe('30D');
      await fetchTraderPerformance('0xabc', { period: '7D' });
      expect(vi.mocked(apiClient.apiClient).mock.calls[1][0]).toContain('period=7D');
    });

    it('fetchTraderPerformance throws when no data returned', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({ success: true });
      await expect(fetchTraderPerformance('0xabc')).rejects.toThrow('No data returned');
    });
  });

  describe('triggerTraderSync (contract v1.1 §1)', () => {
    it('POSTs to /api/v1/traders/{wallet}/sync with default venue', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({
        success: true,
        data: { status: 'queued' },
      });
      const result = await triggerTraderSync('0xabc');
      const [url, options] = vi.mocked(apiClient.apiClient).mock.calls[0] as [string, RequestInit];
      expect(url).toBe('/api/v1/traders/0xabc/sync?venue=hyperliquid');
      expect(options.method).toBe('POST');
      expect(result).toEqual({ status: 'queued' });
    });

    it('maps in_flight and recent statuses without inventing fields', async () => {
      vi.mocked(apiClient.apiClient)
        .mockResolvedValueOnce({ success: true, data: { status: 'in_flight' } })
        .mockResolvedValueOnce({ success: true, data: { status: 'recent' } });
      expect(await triggerTraderSync('0xabc')).toEqual({ status: 'in_flight' });
      expect(await triggerTraderSync('0xabc')).toEqual({ status: 'recent' });
    });

    it('throws when no data returned', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({ success: true });
      await expect(triggerTraderSync('0xabc')).rejects.toThrow('No data returned');
    });
  });

  describe('trader-groups', () => {
    it('gets a single group', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({
        success: true,
        data: { id: 'g1', name: 'Main' },
      });
      expect(await getTraderGroup('g1')).toEqual({ id: 'g1', name: 'Main' });
      expect(vi.mocked(apiClient.apiClient).mock.calls[0][0]).toBe('/api/v1/trader-groups/g1');
    });

    it('throws when a group is missing', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({ success: true });
      await expect(getTraderGroup('g9')).rejects.toThrow('No data returned');
    });

    it('lists members with default and custom periods', async () => {
      vi.mocked(apiClient.apiClient)
        .mockResolvedValueOnce({ success: true, data: [] })
        .mockResolvedValueOnce({ success: true, data: [] });
      expect(await listGroupMembers('g1')).toEqual([]);
      expect(vi.mocked(apiClient.apiClient).mock.calls[0][0]).toBe(
        '/api/v1/trader-groups/g1/members?period=30D',
      );
      await listGroupMembers('g1', '7D');
      expect(vi.mocked(apiClient.apiClient).mock.calls[1][0]).toBe(
        '/api/v1/trader-groups/g1/members?period=7D',
      );
    });

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

    it('patches members and reports updated count', async () => {
      vi.mocked(apiClient.apiClient)
        .mockResolvedValueOnce({ success: true, data: { updated: 1 } })
        .mockResolvedValueOnce({ success: true });
      const members = [{ venue: 'hyperliquid', wallet_address: '0x1', alias: 'w1', note: '' }];
      expect(await updateGroupMembers('g1', members)).toEqual({ updated: 1 });
      const [url, options] = vi.mocked(apiClient.apiClient).mock.calls[0] as [string, RequestInit];
      expect(url).toBe('/api/v1/trader-groups/g1/members');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body as string)).toEqual({ members });
      expect(await updateGroupMembers('g1', members)).toEqual({ updated: 0 });
    });
  });
});
