import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '@/infrastructure/api-client';
import {
  addGroupMembers,
  buildTraderSearchRequest,
  createTraderGroup,
  deleteTraderGroup,
  fetchTraderActivity,
  fetchTraderBalances,
  fetchBucketDetail,
  fetchBucketMarkets,
  fetchBucketWallets,
  fetchTraderDetail,
  fetchTraderFills,
  fetchTraderOverview,
  fetchTraderOrders,
  fetchTraderPerformance,
  fetchTraderPositions,
  fetchTraderTransfers,
  getTraderGroup,
  listGroupMembers,
  listTraderGroups,
  removeGroupMembers,
  searchTraders,
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

    it('returns empty data when res.data is null', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValue({
        success: true,
        data: null,
        meta: { total: 0, total_pages: 1, page: 1, limit: 20 },
      });
      const result = await searchTraders();
      expect(result).toEqual({
        data: [],
        meta: { total: 0, total_pages: 1, page: 1, limit: 20 },
      });
    });

    it('returns empty data when res.data is undefined', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValue({
        success: true,
        meta: { total: 0, total_pages: 1, page: 1, limit: 20 },
      });
      const result = await searchTraders();
      expect(result).toEqual({
        data: [],
        meta: { total: 0, total_pages: 1, page: 1, limit: 20 },
      });
    });

    it('passes meta through when present', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValue({
        success: true,
        data: null,
      });
      const result = await searchTraders();
      expect(result).toEqual({ data: [], meta: {} });
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
        data: {
          rows: [],
          next_cursor: null,
          has_more: false,
          counts: { win: 0, loss: 0, long: 0, short: 0, total: 0 },
          data_status: 'ready',
          as_of: '2026-10-08T00:00:00Z',
          partial: false,
        },
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
        data: {
          rows: [],
          next_cursor: 'c2',
          has_more: true,
          counts: { win: 0, loss: 0, long: 0, short: 0, total: 0 },
          data_status: 'ready',
          as_of: '2026-10-08T00:00:00Z',
          partial: false,
        },
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
          data_status: 'ready',
          as_of: '2026-10-08T00:00:00Z',
          partial: false,
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
        data: { perp: null, spot: null, data_status: 'ready' },
      });
      const snap = await fetchTraderBalances('0xabc');
      expect(vi.mocked(apiClient.apiClient).mock.calls[0][0]).toBe(
        '/api/v1/traders/0xabc/balances?venue=hyperliquid',
      );
      expect(snap.data_status).toBe('ready');
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

    it('fetchTraderPerformance defaults to 30D/perps and forwards period and mode', async () => {
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
      expect(vi.mocked(apiClient.apiClient).mock.calls[0][0]).toContain('mode=perps');
      expect(monthly.period).toBe('30D');
      await fetchTraderPerformance('0xabc', { period: '7D', mode: 'combined', seriesOnly: true });
      expect(vi.mocked(apiClient.apiClient).mock.calls[1][0]).toContain('period=7D');
      expect(vi.mocked(apiClient.apiClient).mock.calls[1][0]).toContain('mode=combined');
      expect(vi.mocked(apiClient.apiClient).mock.calls[1][0]).toContain('series_only=true');
    });

    it('fetchTraderPerformance throws when no data returned', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({ success: true });
      await expect(fetchTraderPerformance('0xabc')).rejects.toThrow('No data returned');
    });
  });

  describe('fetchTraderOverview', () => {
    it('GETs /api/v1/traders/overview with venue, period and series_days', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({
        success: true,
        data: {
          as_of: '2026-01-01T00:00:00Z',
          venue: 'hyperliquid',
          period: '30D',
          pnl_metric: 'realized_pnl',
          universe_size: 10,
          pnl_buckets: [],
          account_buckets: [],
          coverage: {
            pnl_wallets: 10,
            account_value_wallets: 5,
            series_wallets: 5,
            data_status: { ready: 10, stale: 0, error: 0, syncing: 0 },
          },
        },
      });
      const overview = await fetchTraderOverview({
        venue: 'hyperliquid',
        period: '7D',
        seriesDays: 14,
      });
      const url = vi.mocked(apiClient.apiClient).mock.calls[0][0] as string;
      expect(url).toContain('/api/v1/traders/overview');
      expect(url).toContain('venue=hyperliquid');
      expect(url).toContain('period=7D');
      expect(url).toContain('series_days=14');
      expect(overview.universe_size).toBe(10);
    });

    it('uses defaults when params omitted', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({
        success: true,
        data: {
          as_of: '2026-01-01T00:00:00Z',
          venue: 'hyperliquid',
          period: '30D',
          pnl_metric: 'realized_pnl',
          universe_size: 0,
          pnl_buckets: [],
          account_buckets: [],
          coverage: {
            pnl_wallets: 0,
            account_value_wallets: 0,
            series_wallets: 0,
            data_status: { ready: 0, stale: 0, error: 0, syncing: 0 },
          },
        },
      });
      await fetchTraderOverview();
      const url = vi.mocked(apiClient.apiClient).mock.calls[0][0] as string;
      expect(url).toContain('period=30D');
      expect(url).toContain('series_days=30');
    });

    it('throws when no data returned', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({ success: true });
      await expect(fetchTraderOverview()).rejects.toThrow('No data returned');
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
  describe('fetchBucketDetail', () => {
    it('GETs bucket detail', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({
        success: true,
        data: {
          as_of: '2026-01-01T00:00:00Z',
          kind: 'pnl',
          bucket_id: 'profitable',
          wallet_count: 2,
          sentiment: 'bullish',
          long_ratio: 0.6,
          pnl_split: { pct_profit: 0.6, pct_loss: 0.4, usd_profit: 100, usd_loss: -40 },
          notional_split: { long_usd: 300, short_usd: 200 },
          positioning: [{ t: '2026-01-01', long_pct: 0.6 }],
          markets_top: [
            {
              market: 'BTC',
              notional: 100,
              upnl: 10,
              sentiment: 'bullish',
              traders: 2,
              asset_id: '',
              asset_category: '',
              logo_url: null,
            },
          ],
          coverage: { wallets_with_positions: 1, wallets_with_trades: 2 },
          markets_source: 'positions',
        },
      });
      const res = await fetchBucketDetail({
        kind: 'pnl',
        bucket: 'profitable',
        venue: 'hyperliquid',
        period: '30D',
        range: '30D',
      });
      const url = vi.mocked(apiClient.apiClient).mock.calls[0][0] as string;
      expect(url).toContain('/api/v1/traders/overview/buckets/pnl/profitable');
      expect(res.bucket_id).toBe('profitable');
    });
  });

  describe('fetchBucketWallets', () => {
    it('GETs bucket wallets', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({
        success: true,
        data: [
          {
            address: '0x1',
            display_name: 'A',
            perp_equity: 10,
            position_value: 5,
            leverage: 2,
            win_rate: 0.5,
            volume_range: 100,
            realized_pnl: 5,
            bias: 'bullish',
            cohort: 'medium',
          },
        ],
        meta: { page: 1, total: 1, total_pages: 1, limit: 20, has_more: false },
      });
      const res = await fetchBucketWallets({ kind: 'pnl', bucket: 'profitable' });
      const url = vi.mocked(apiClient.apiClient).mock.calls[0][0] as string;
      expect(url).toContain('/wallets');
      expect(res.data.length).toBe(1);
    });
  });

  describe('fetchBucketMarkets', () => {
    it('GETs bucket markets', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValueOnce({
        success: true,
        data: [
          {
            market: 'BTC',
            sentiment: 'bullish',
            notional_long: 10,
            notional_short: 5,
            traders_long: 1,
            traders_short: 1,
            pnl_profit: 2,
            pnl_loss: -1,
          },
        ],
        meta: { page: 1, total: 1, total_pages: 1, limit: 20, has_more: false },
      });
      const res = await fetchBucketMarkets({ kind: 'pnl', bucket: 'profitable', search: 'BTC' });
      const url = vi.mocked(apiClient.apiClient).mock.calls[0][0] as string;
      expect(url).toContain('/markets');
      expect(url).toContain('search=BTC');
      expect(res.data.length).toBe(1);
    });
  });
});
