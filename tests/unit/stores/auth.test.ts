import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '@/lib/stores/auth';
import * as authService from '@/services/auth';
import * as tokenLib from '@/lib/token';

vi.mock('@/services/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('@/lib/token', () => ({
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
  getRefreshToken: vi.fn(),
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
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
    });
  });

  describe('login', () => {
    it('sets tokens and user on success', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockAuthResponse);

      await useAuthStore.getState().login('test@test.com', 'password');

      expect(tokenLib.setTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
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
    it('sets tokens and user on success', async () => {
      vi.mocked(authService.register).mockResolvedValue(mockAuthResponse);

      await useAuthStore.getState().register('test@test.com', 'password123');

      expect(tokenLib.setTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('throws and resets isLoading on error', async () => {
      vi.mocked(authService.register).mockRejectedValue(new Error('Email exists'));

      await expect(useAuthStore.getState().register('test@test.com', 'password')).rejects.toThrow(
        'Email exists',
      );

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('clears tokens and user', async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true });
      vi.mocked(authService.logout).mockResolvedValue();

      await useAuthStore.getState().logout();

      expect(tokenLib.clearTokens).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('clears tokens even if API fails', async () => {
      vi.mocked(authService.logout).mockRejectedValue(new Error('Network error'));

      await useAuthStore.getState().logout();

      expect(tokenLib.clearTokens).toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
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
    it('loads user if refresh token exists', async () => {
      vi.mocked(tokenLib.getRefreshToken).mockReturnValue('refresh-token');
      vi.mocked(authService.getMe).mockResolvedValue(mockUser);

      await useAuthStore.getState().initialize();

      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().isInitialized).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('clears tokens and marks initialized if getMe fails', async () => {
      vi.mocked(tokenLib.getRefreshToken).mockReturnValue('refresh-token');
      vi.mocked(authService.getMe).mockRejectedValue(new Error('Unauthorized'));

      await useAuthStore.getState().initialize();

      expect(tokenLib.clearTokens).toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().isInitialized).toBe(true);
    });

    it('marks initialized without loading if no refresh token', async () => {
      vi.mocked(tokenLib.getRefreshToken).mockReturnValue(null);

      await useAuthStore.getState().initialize();

      expect(useAuthStore.getState().isInitialized).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(authService.getMe).not.toHaveBeenCalled();
    });
  });
});
