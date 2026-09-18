import { create } from 'zustand';
import type { UserResponse } from '@/types/auth';
import * as authService from '@/services/auth';
import { setTokens, clearTokens, getRefreshToken } from '@/lib/token';

interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = await authService.login({ email, password });
      setTokens(data.access_token, data.refresh_token);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = await authService.register({ email, password });
      setTokens(data.access_token, data.refresh_token);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout errors, clear tokens anyway
    }
    clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true });
    } catch {
      clearTokens();
      set({ user: null, isAuthenticated: false });
    }
  },

  initialize: async () => {
    if (getRefreshToken()) {
      set({ isLoading: true });
      try {
        const user = await authService.getMe();
        set({ user, isAuthenticated: true, isInitialized: true, isLoading: false });
      } catch {
        clearTokens();
        set({ user: null, isAuthenticated: false, isInitialized: true, isLoading: false });
      }
    } else {
      set({ isInitialized: true });
    }
  },
}));
