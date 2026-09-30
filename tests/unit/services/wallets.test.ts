import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '@/infrastructure/api-client';
import {
  scanWallets,
  addWalletsToGroup,
  removeWalletsFromGroup,
  buildWalletQueryParams,
} from '@/services/wallets';

vi.mock('@/infrastructure/api-client', () => ({
  apiClient: vi.fn(),
}));

describe('wallets service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('buildWalletQueryParams', () => {
    it('includes start/end for global scanner', () => {
      const params = buildWalletQueryParams({
        start: '2024-01-01T00:00:00Z',
        end: '2024-02-01T00:00:00Z',
      });
      expect(params.get('start')).toBe('2024-01-01T00:00:00Z');
      expect(params.get('end')).toBe('2024-02-01T00:00:00Z');
    });

    it('defaults page/limit without include flag', () => {
      const params = buildWalletQueryParams({});
      expect(params.get('page')).toBe('1');
      expect(params.get('limit')).toBe('50');
      expect(params.get('include')).toBeNull();
    });
  });

  describe('scanWallets', () => {
    it('calls GET /api/v1/wallets with query and returns data + meta', async () => {
      const wallets = [{ id: 'w1' }];
      const meta = { page: 1, total_pages: 2, total: 20 };
      vi.mocked(apiClient.apiClient).mockResolvedValue({ success: true, data: wallets, meta });
      const result = await scanWallets({ timeframe: '7D', sort: 'roi' });
      const url = vi.mocked(apiClient.apiClient).mock.calls[0][0] as string;
      expect(url).toContain('/api/v1/wallets?');
      expect(url).toContain('timeframe=7D');
      expect(url).toContain('sort=roi');
      expect(result.data).toEqual(wallets);
      expect(result.meta).toEqual(meta);
    });

    it('throws when no data returned', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValue({ success: true });
      await expect(scanWallets()).rejects.toThrow('No data returned');
    });
  });

  describe('addWalletsToGroup', () => {
    it('POSTs wallet ids and returns added/skipped', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValue({
        success: true,
        data: { added: 2, skipped: 1 },
      });
      const result = await addWalletsToGroup('g1', ['w1', 'w2']);
      expect(apiClient.apiClient).toHaveBeenCalledWith(
        '/api/v1/groups/g1/wallets',
        expect.objectContaining({ method: 'POST' }),
      );
      const body = JSON.parse(vi.mocked(apiClient.apiClient).mock.calls[0][1]?.body as string);
      expect(body.wallets).toEqual(['w1', 'w2']);
      expect(result).toEqual({ added: 2, skipped: 1 });
    });

    it('throws when no data returned', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValue({ success: true });
      await expect(addWalletsToGroup('g1', ['w1'])).rejects.toThrow('No data returned');
    });
  });

  describe('removeWalletsFromGroup', () => {
    it('sends DELETE with wallet ids', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValue({});
      await removeWalletsFromGroup('g1', ['w1']);
      expect(apiClient.apiClient).toHaveBeenCalledWith(
        '/api/v1/groups/g1/wallets',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });
});
