import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore, formatAddress } from '@/lib/stores/auth';
import * as authService from '@/services/auth';
import * as tokenLib from '@/lib/token';
import { getAccount } from 'wagmi/actions';

vi.mock('@/services/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
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

const mockAuthResponse = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_at: 1234567890,
  user: mockUser,
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
    });
  });

  describe('login', () => {
    it('sets tokens, user, authMethod on success', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockAuthResponse);
      await useAuthStore.getState().login('test@test.com', 'password');
      expect(tokenLib.setTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().authMethod).toBe('email');
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading during login', async () => {
      let resolveLogin: (value: typeof mockAuthResponse) => void;
      vi.mocked(authService.login).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveLogin = resolve;
          }),
      );
      const loginPromise = useAuthStore.getState().login('test@test.com', 'password');
      expect(useAuthStore.getState().isLoading).toBe(true);
      resolveLogin!(mockAuthResponse);
      await loginPromise;
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('throws and resets isLoading on error', async () => {
      vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'));
      await expect(useAuthStore.getState().login('test@test.com', 'wrong')).rejects.toThrow(
        'Invalid credentials',
      );
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('register', () => {
    it('sets tokens, user, authMethod on success', async () => {
      vi.mocked(authService.register).mockResolvedValue(mockAuthResponse);
      await useAuthStore.getState().register('test@test.com', 'password');
      expect(tokenLib.setTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().authMethod).toBe('email');
    });

    it('throws and resets isLoading on error', async () => {
      vi.mocked(authService.register).mockRejectedValue(new Error('Email taken'));
      await expect(useAuthStore.getState().register('test@test.com', 'password')).rejects.toThrow(
        'Email taken',
      );
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
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
