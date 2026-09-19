import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '@/infrastructure/api-client';
import { getVenues, getFundingArbitrage } from '@/services/funding-arbitrage';

vi.mock('@/infrastructure/api-client', () => ({
  apiClient: vi.fn(),
}));

const mockVenues = [
  {
    id: 'v1',
    code: 'BINANCE',
    name: 'Binance',
    exchange_name: 'Binance',
    venue_type: 'CEX' as const,
    status: 'ACTIVE' as const,
  },
  {
    id: 'v2',
    code: 'OKX',
    name: 'OKX',
    exchange_name: 'OKX',
    venue_type: 'CEX' as const,
    status: 'ACTIVE' as const,
  },
  {
    id: 'v3',
    code: 'BYBIT',
    name: 'Bybit',
    exchange_name: 'Bybit',
    venue_type: 'CEX' as const,
    status: 'ACTIVE' as const,
  },
];

const mockPairs = [
  {
    venue_a: { id: 'v1', code: 'BINANCE', name: 'Binance' },
    venue_b: { id: 'v2', code: 'OKX', name: 'OKX' },
    tokens: [
      {
        symbol: 'BTC-USDT',
        instrument_id: 'btc-usdt',
        long_venue_id: 'v1',
        short_venue_id: 'v2',
        funding_available: true,
        is_stale: false,
        apr_1h_percent: 5.2,
        apr_4h_percent: 10.5,
        apy_percent: 156.3,
        price_spread_percent: 0.01,
        venue_a_symbol: 'BTC-USDT',
        venue_a_funding_rate: '0.00012',
        venue_a_interval_seconds: 28800,
        venue_a_observed_at: '2024-01-01T00:00:00Z',
        venue_a_oi: '1000000',
        venue_b_symbol: 'BTC-USDT',
        venue_b_funding_rate: '-0.00003',
        venue_b_interval_seconds: 28800,
        venue_b_observed_at: '2024-01-01T00:00:00Z',
        venue_b_oi: '500000',
      },
    ],
  },
];

describe('funding-arbitrage service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getVenues', () => {
    it('calls GET /api/v1/venues', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValue({
        success: true,
        data: mockVenues,
      });
      const result = await getVenues();
      expect(apiClient.apiClient).toHaveBeenCalledWith('/api/v1/venues');
      expect(result).toEqual(mockVenues);
    });

    it('throws when no data returned', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValue({ success: true });
      await expect(getVenues()).rejects.toThrow('No data returned');
    });

    it('throws on API error', async () => {
      vi.mocked(apiClient.apiClient).mockRejectedValue(new Error('Network error'));
      await expect(getVenues()).rejects.toThrow('Network error');
    });
  });

  describe('getFundingArbitrage', () => {
    it('calls endpoint with venue_id', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValue({
        success: true,
        data: { cache_status: 'fresh', data_as_of: '2024-01-01T00:00:00Z', pairs: mockPairs },
        meta: { cursor: 'next', has_more: true, limit: 50 },
      });
      await getFundingArbitrage(['v1', 'v2']);
      const url = vi.mocked(apiClient.apiClient).mock.calls[0][0] as string;
      expect(url).toContain('/api/v1/funding/arbitrage');
      expect(url).toContain('venue_id=v1%2Cv2');
    });

    it('includes sort param', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValue({
        success: true,
        data: { cache_status: 'fresh', data_as_of: '2024-01-01T00:00:00Z', pairs: [] },
        meta: {},
      });
      await getFundingArbitrage(['v1', 'v2'], { sort: 'apr_1h_desc' });
      const url = vi.mocked(apiClient.apiClient).mock.calls[0][0] as string;
      expect(url).toContain('sort=apr_1h_desc');
    });

    it('includes limit param', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValue({
        success: true,
        data: { cache_status: 'fresh', data_as_of: '2024-01-01T00:00:00Z', pairs: [] },
        meta: {},
      });
      await getFundingArbitrage(['v1', 'v2'], { limit: 100 });
      const url = vi.mocked(apiClient.apiClient).mock.calls[0][0] as string;
      expect(url).toContain('limit=100');
    });

    it('includes cursor param', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValue({
        success: true,
        data: { cache_status: 'fresh', data_as_of: '2024-01-01T00:00:00Z', pairs: [] },
        meta: {},
      });
      await getFundingArbitrage(['v1', 'v2'], { cursor: 'abc123' });
      const url = vi.mocked(apiClient.apiClient).mock.calls[0][0] as string;
      expect(url).toContain('cursor=abc123');
    });

    it('returns data and meta', async () => {
      const mockData = {
        cache_status: 'fresh',
        data_as_of: '2024-01-01T00:00:00Z',
        pairs: mockPairs,
      };
      const mockMeta = { cursor: 'next', has_more: true, limit: 50 };
      vi.mocked(apiClient.apiClient).mockResolvedValue({
        success: true,
        data: mockData,
        meta: mockMeta,
      });
      const result = await getFundingArbitrage(['v1', 'v2']);
      expect(result.data).toEqual(mockData);
      expect(result.meta).toEqual(mockMeta);
    });

    it('throws when less than 2 venues', async () => {
      await expect(getFundingArbitrage(['v1'])).rejects.toThrow('At least 2 venues');
    });

    it('throws when more than 10 venues', async () => {
      const ids = Array.from({ length: 11 }, (_, i) => `v${i}`);
      await expect(getFundingArbitrage(ids)).rejects.toThrow('Maximum 10 venues');
    });

    it('throws when no data returned', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValue({ success: true });
      await expect(getFundingArbitrage(['v1', 'v2'])).rejects.toThrow('No data returned');
    });

    it('throws on API error', async () => {
      vi.mocked(apiClient.apiClient).mockRejectedValue(new Error('Network error'));
      await expect(getFundingArbitrage(['v1', 'v2'])).rejects.toThrow('Network error');
    });
  });
});
