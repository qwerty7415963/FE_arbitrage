import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore, formatAddress } from '@/lib/stores/auth';
import * as authService from '@/services/auth';
import * as tokenLib from '@/lib/token';
import { getAccount } from 'wagmi/actions';

vi.mock('@/services/auth', () => ({
  logout: vi.fn(),
  getMe: vi.fn(),
  getNonce: vi.fn(),
  verifyWallet: vi.fn(),
}));

vi.mock('@/lib/token', () => ({
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
  getRefreshToken: vi.fn(),
  hasTokens: vi.fn(),
}));

vi.mock('wagmi/actions', () => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  getAccount: vi.fn(),
  signMessage: vi.fn(),
}));

vi.mock('@/lib/wagmi', () => ({
  config: {},
}));

vi.mock('@/config', () => ({
  config: { NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: 'test-id' },
}));

const mockUser = {
  id: '1',
  email: 'test@test.com',
  role: 'user',
  status: 'active',
  created_at: '2024-01-01',
};

describe('auth store', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(getAccount).mockReturnValue({
      address: undefined,
      chainId: undefined,
    } as ReturnType<typeof getAccount>);
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      address: null,
      chainId: null,
      isConnecting: false,
      error: null,
      authMethod: null,
      connectModalOpen: false,
    });
  });

  describe('requireAuth', () => {
    it('returns true when authenticated without opening modal', () => {
      useAuthStore.setState({ isAuthenticated: true, connectModalOpen: false });
      expect(useAuthStore.getState().requireAuth()).toBe(true);
      expect(useAuthStore.getState().connectModalOpen).toBe(false);
    });

    it('opens modal and returns false when unauthenticated', () => {
      useAuthStore.setState({ isAuthenticated: false, connectModalOpen: false });
      expect(useAuthStore.getState().requireAuth()).toBe(false);
      expect(useAuthStore.getState().connectModalOpen).toBe(true);
    });
  });

  describe('logout', () => {
    it('clears tokens and user', async () => {
      vi.mocked(authService.logout).mockResolvedValue(undefined);
      await useAuthStore.getState().logout();
      expect(authService.logout).toHaveBeenCalled();
      expect(tokenLib.clearTokens).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('clears tokens even if API fails', async () => {
      vi.mocked(authService.logout).mockRejectedValue(new Error('Network error'));
      await useAuthStore.getState().logout();
      expect(tokenLib.clearTokens).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('fetchUser', () => {
    it('sets user on success', async () => {
      vi.mocked(authService.getMe).mockResolvedValue(mockUser);
      await useAuthStore.getState().fetchUser();
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('clears tokens and user on failure', async () => {
      vi.mocked(authService.getMe).mockRejectedValue(new Error('Unauthorized'));
      await useAuthStore.getState().fetchUser();
      expect(tokenLib.clearTokens).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('initialize', () => {
    it('loads user if tokens exist', async () => {
      vi.mocked(tokenLib.hasTokens).mockReturnValue(true);
      vi.mocked(authService.getMe).mockResolvedValue(mockUser);
      await useAuthStore.getState().initialize();
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().isInitialized).toBe(true);
    });

    it('clears tokens and marks initialized if getMe fails', async () => {
      vi.mocked(tokenLib.hasTokens).mockReturnValue(true);
      vi.mocked(authService.getMe).mockRejectedValue(new Error('Unauthorized'));
      await useAuthStore.getState().initialize();
      expect(tokenLib.clearTokens).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isInitialized).toBe(true);
    });

    it('marks initialized without loading if no tokens', async () => {
      vi.mocked(tokenLib.hasTokens).mockReturnValue(false);
      await useAuthStore.getState().initialize();
      expect(useAuthStore.getState().isInitialized).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('formatAddress', () => {
    it('formats address with ellipsis', () => {
      expect(formatAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe('0x1234...5678');
    });

    it('returns empty string for empty address', () => {
      expect(formatAddress('')).toBe('');
    });
  });
});
