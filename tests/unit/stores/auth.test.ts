import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthStore, formatAddress } from '@/lib/stores/auth';
import * as authService from '@/services/auth';
import * as tokenLib from '@/lib/token';
import { connect, getAccount, disconnect, signMessage } from 'wagmi/actions';

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

  describe('connectWallet', () => {
    beforeEach(() => {
      (window as unknown as { ethereum?: Record<string, unknown> }).ethereum = {};
    });

    afterEach(() => {
      delete (window as unknown as { ethereum?: Record<string, unknown> }).ethereum;
    });

    it('swallows user rejection without surfacing an error', async () => {
      vi.mocked(connect).mockRejectedValue(
        Object.assign(new Error('User rejected the request.'), {
          name: 'UserRejectedRequestError',
          code: 4001,
        }),
      );

      await expect(useAuthStore.getState().connectWallet()).resolves.toBeUndefined();
      expect(useAuthStore.getState().error).toBeNull();
      expect(useAuthStore.getState().isConnecting).toBe(false);
    });

    it('swallows rejection reported only via message', async () => {
      vi.mocked(connect).mockRejectedValue(new Error('User rejected the request.'));

      await expect(useAuthStore.getState().connectWallet()).resolves.toBeUndefined();
      expect(useAuthStore.getState().error).toBeNull();
      expect(useAuthStore.getState().isConnecting).toBe(false);
    });

    it('swallows wagmi-style rejection via shortMessage', async () => {
      vi.mocked(connect).mockRejectedValue(
        Object.assign(new Error('request failed'), {
          shortMessage: 'User denied transaction signature.',
        }),
      );

      await expect(useAuthStore.getState().connectWallet()).resolves.toBeUndefined();
      expect(useAuthStore.getState().error).toBeNull();
      expect(useAuthStore.getState().isConnecting).toBe(false);
    });

    it('swallows WalletConnect modal close rejection', async () => {
      vi.mocked(connect).mockRejectedValue(
        new Error('Connection request reset. Please try again.'),
      );

      await expect(useAuthStore.getState().connectWallet()).resolves.toBeUndefined();
      expect(useAuthStore.getState().error).toBeNull();
      expect(useAuthStore.getState().isConnecting).toBe(false);
    });

    it('swallows modal-closed error by name', async () => {
      vi.mocked(connect).mockRejectedValue(
        Object.assign(new Error('Modal closed'), { name: 'WalletConnectModalClosedError' }),
      );

      await expect(useAuthStore.getState().connectWallet()).resolves.toBeUndefined();
      expect(useAuthStore.getState().error).toBeNull();
    });

    it('stores generic errors without rejecting', async () => {
      vi.mocked(connect).mockRejectedValue(new Error('boom'));

      await expect(useAuthStore.getState().connectWallet()).resolves.toBeUndefined();
      expect(useAuthStore.getState().error).toBe('boom');
      expect(useAuthStore.getState().isConnecting).toBe(false);
    });

    it('authenticates on successful connect + signature', async () => {
      vi.mocked(connect).mockResolvedValue({
        accounts: ['0xabc'],
        chainId: 1,
      } as never);
      vi.mocked(authService.getNonce).mockResolvedValue({
        id: 'nonce-1',
        address: '0xabc',
        chain_id: 1,
        nonce: 'n',
        created_at: '2024-01-01T00:00:00Z',
        expires_at: '2024-01-01T00:05:00Z',
        used: false,
      });
      vi.mocked(signMessage).mockResolvedValue('0xsig');
      vi.mocked(authService.verifyWallet).mockResolvedValue({
        access_token: 'a',
        refresh_token: 'r',
        expires_at: 0,
        user: mockUser,
      });

      await useAuthStore.getState().connectWallet();

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().address).toBe('0xabc');
      expect(useAuthStore.getState().chainId).toBe(1);
      expect(useAuthStore.getState().error).toBeNull();
      expect(tokenLib.setTokens).toHaveBeenCalledWith('a', 'r');
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

  describe('clearSession', () => {
    it('clears address + calls disconnect + clearTokens', async () => {
      vi.mocked(disconnect).mockResolvedValue(undefined as never);
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        address: '0xabc',
        chainId: 1,
        authMethod: 'wallet',
        error: 'boom',
        isConnecting: true,
      });
      await useAuthStore.getState().clearSession();
      expect(disconnect).toHaveBeenCalled();
      expect(tokenLib.clearTokens).toHaveBeenCalled();
      expect(useAuthStore.getState().address).toBeNull();
      expect(useAuthStore.getState().chainId).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().authMethod).toBeNull();
      expect(useAuthStore.getState().error).toBeNull();
      expect(useAuthStore.getState().isConnecting).toBe(false);
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

    it('keeps persisted address when wagmi has not reconnected', async () => {
      vi.mocked(tokenLib.hasTokens).mockReturnValue(true);
      vi.mocked(authService.getMe).mockResolvedValue(mockUser);
      vi.mocked(getAccount).mockReturnValue({
        address: undefined,
        chainId: undefined,
      } as ReturnType<typeof getAccount>);
      useAuthStore.setState({ address: '0xpersisted', chainId: 1 });
      await useAuthStore.getState().initialize();
      expect(useAuthStore.getState().address).toBe('0xpersisted');
      expect(useAuthStore.getState().chainId).toBe(1);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('uses wagmi account address when available', async () => {
      vi.mocked(tokenLib.hasTokens).mockReturnValue(true);
      vi.mocked(authService.getMe).mockResolvedValue(mockUser);
      vi.mocked(getAccount).mockReturnValue({
        address: '0xabc',
        chainId: 1,
      } as unknown as ReturnType<typeof getAccount>);
      useAuthStore.setState({ address: '0xpersisted' });
      await useAuthStore.getState().initialize();
      expect(useAuthStore.getState().address).toBe('0xabc');
      expect(useAuthStore.getState().chainId).toBe(1);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
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

    it('initialize without tokens -> address null even if wagmi has account', async () => {
      vi.mocked(tokenLib.hasTokens).mockReturnValue(false);
      vi.mocked(getAccount).mockReturnValue({
        address: '0xabc',
        chainId: 1,
      } as unknown as ReturnType<typeof getAccount>);
      useAuthStore.setState({ address: '0xold' });
      await useAuthStore.getState().initialize();
      expect(useAuthStore.getState().address).toBeNull();
      expect(useAuthStore.getState().chainId).toBeNull();
      expect(disconnect).not.toHaveBeenCalled();
    });

    it('initialize getMe fail -> address null + disconnect called', async () => {
      vi.mocked(tokenLib.hasTokens).mockReturnValue(true);
      vi.mocked(authService.getMe).mockRejectedValue(new Error('Unauthorized'));
      vi.mocked(getAccount).mockReturnValue({
        address: '0xabc',
        chainId: 1,
      } as unknown as ReturnType<typeof getAccount>);
      useAuthStore.setState({ address: '0xold' });
      await useAuthStore.getState().initialize();
      expect(tokenLib.clearTokens).toHaveBeenCalled();
      expect(disconnect).toHaveBeenCalled();
      expect(useAuthStore.getState().address).toBeNull();
      expect(useAuthStore.getState().isInitialized).toBe(true);
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
