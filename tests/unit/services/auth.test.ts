import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '@/infrastructure/api-client';
import * as authService from '@/services/auth';

vi.mock('@/infrastructure/api-client', () => ({
  apiClient: vi.fn(),
  apiClientNoAuth: vi.fn(),
}));

describe('auth service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('calls POST /auth/login with correct body', async () => {
      const mockResponse = {
        success: true,
        data: {
          access_token: 'access',
          refresh_token: 'refresh',
          expires_at: 123,
          user: { id: '1', email: 'test@test.com', role: 'user', status: 'active', created_at: '' },
        },
      };
      vi.mocked(apiClient.apiClientNoAuth).mockResolvedValue(mockResponse);

      const result = await authService.login({ email: 'test@test.com', password: 'password123' });

      expect(apiClient.apiClientNoAuth).toHaveBeenCalledWith('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('throws when no data returned', async () => {
      vi.mocked(apiClient.apiClientNoAuth).mockResolvedValue({ success: true });

      await expect(authService.login({ email: 'a', password: 'b' })).rejects.toThrow(
        'No data returned',
      );
    });
  });

  describe('register', () => {
    it('calls POST /auth/register with correct body', async () => {
      const mockResponse = {
        success: true,
        data: {
          access_token: 'access',
          refresh_token: 'refresh',
          expires_at: 123,
          user: { id: '1', email: 'new@test.com', role: 'user', status: 'active', created_at: '' },
        },
      };
      vi.mocked(apiClient.apiClientNoAuth).mockResolvedValue(mockResponse);

      const result = await authService.register({ email: 'new@test.com', password: 'password123' });

      expect(apiClient.apiClientNoAuth).toHaveBeenCalledWith('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'new@test.com', password: 'password123' }),
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getMe', () => {
    it('calls GET /auth/me', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        role: 'user',
        status: 'active',
        created_at: '',
      };
      vi.mocked(apiClient.apiClient).mockResolvedValue({ success: true, data: mockUser });

      const result = await authService.getMe();

      expect(apiClient.apiClient).toHaveBeenCalledWith('/api/v1/auth/me');
      expect(result).toEqual(mockUser);
    });
  });

  describe('refresh', () => {
    it('calls POST /auth/refresh with refresh_token', async () => {
      const mockResponse = {
        success: true,
        data: {
          access_token: 'new-access',
          refresh_token: 'new-refresh',
          expires_at: 456,
          user: { id: '1', email: 'test@test.com', role: 'user', status: 'active', created_at: '' },
        },
      };
      vi.mocked(apiClient.apiClientNoAuth).mockResolvedValue(mockResponse);

      const result = await authService.refresh('old-refresh-token');

      expect(apiClient.apiClientNoAuth).toHaveBeenCalledWith('/api/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: 'old-refresh-token' }),
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('logout', () => {
    it('calls POST /auth/logout', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValue({ success: true });

      await authService.logout();

      expect(apiClient.apiClient).toHaveBeenCalledWith('/api/v1/auth/logout', {
        method: 'POST',
      });
    });
  });

  describe('changePassword', () => {
    it('calls POST /auth/change-password', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValue({ success: true });

      await authService.changePassword({ old_password: 'old', new_password: 'new12345' });

      expect(apiClient.apiClient).toHaveBeenCalledWith('/api/v1/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ old_password: 'old', new_password: 'new12345' }),
      });
    });
  });

  describe('getNonce', () => {
    it('calls POST /auth/wallet/nonce', async () => {
      const mockNonce = {
        id: '1',
        address: '0x123',
        chain_id: 1,
        nonce: 'abc',
        created_at: '',
        expires_at: '',
        used: false,
      };
      vi.mocked(apiClient.apiClientNoAuth).mockResolvedValue({ success: true, data: mockNonce });

      const result = await authService.getNonce({ address: '0x123', chain_id: 1 });

      expect(apiClient.apiClientNoAuth).toHaveBeenCalledWith('/api/v1/auth/wallet/nonce', {
        method: 'POST',
        body: JSON.stringify({ address: '0x123', chain_id: 1 }),
      });
      expect(result).toEqual(mockNonce);
    });
  });

  describe('verifyWallet', () => {
    it('calls POST /auth/wallet/verify', async () => {
      const mockResponse = {
        success: true,
        data: {
          access_token: 'access',
          refresh_token: 'refresh',
          expires_at: 123,
          user: { id: '1', email: '', role: 'user', status: 'active', created_at: '' },
        },
      };
      vi.mocked(apiClient.apiClientNoAuth).mockResolvedValue(mockResponse);

      const result = await authService.verifyWallet({ message: 'msg', signature: '0x sig' });

      expect(apiClient.apiClientNoAuth).toHaveBeenCalledWith('/api/v1/auth/wallet/verify', {
        method: 'POST',
        body: JSON.stringify({ message: 'msg', signature: '0x sig' }),
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getWallets', () => {
    it('calls GET /auth/wallet/list', async () => {
      const mockWallets = [
        { id: '1', address: '0x123', chain_id: 1, is_primary: true, verified_at: '' },
      ];
      vi.mocked(apiClient.apiClient).mockResolvedValue({ success: true, data: mockWallets });

      const result = await authService.getWallets();

      expect(apiClient.apiClient).toHaveBeenCalledWith('/api/v1/auth/wallet/list');
      expect(result).toEqual(mockWallets);
    });
  });

  describe('linkWallet', () => {
    it('calls POST /auth/wallet/link', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValue({ success: true });

      await authService.linkWallet({
        address: '0x123',
        chain_id: 1,
        message: 'msg',
        signature: '0x sig',
      });

      expect(apiClient.apiClient).toHaveBeenCalledWith('/api/v1/auth/wallet/link', {
        method: 'POST',
        body: JSON.stringify({
          address: '0x123',
          chain_id: 1,
          message: 'msg',
          signature: '0x sig',
        }),
      });
    });
  });

  describe('unlinkWallet', () => {
    it('calls DELETE /auth/wallet/{id}', async () => {
      vi.mocked(apiClient.apiClient).mockResolvedValue({ success: true });

      await authService.unlinkWallet('wallet-123');

      expect(apiClient.apiClient).toHaveBeenCalledWith('/api/v1/auth/wallet/wallet-123', {
        method: 'DELETE',
      });
    });
  });
});
