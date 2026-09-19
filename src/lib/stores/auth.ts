import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { connect, disconnect, getAccount, signMessage } from 'wagmi/actions';
import { injected, walletConnect } from 'wagmi/connectors';
import { config } from '@/lib/wagmi';
import { config as appConfig } from '@/config';
import * as authService from '@/services/auth';
import { setTokens, clearTokens, hasTokens } from '@/lib/token';
import type { UserResponse } from '@/types/auth';

declare global {
  interface Window {
    ethereum?: Record<string, unknown>;
  }
}

function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function buildSiweMessage(params: {
  address: string;
  chainId: number;
  nonce: string;
  domain: string;
  uri: string;
  issuedAt: string;
}): string {
  const { address, chainId, nonce, domain, uri, issuedAt } = params;
  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    'I want to sign in to Arbitrage.',
    '',
    `URI: ${uri}`,
    `Version: 1`,
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n');
}

interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
  authMethod: 'email' | 'wallet' | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      address: null,
      chainId: null,
      isConnecting: false,
      error: null,
      authMethod: null,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const data = await authService.login({ email, password });
          setTokens(data.access_token, data.refresh_token);
          set({
            user: data.user,
            isAuthenticated: true,
            authMethod: 'email',
            isLoading: false,
          });
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
          set({
            user: data.user,
            isAuthenticated: true,
            authMethod: 'email',
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      connectWallet: async () => {
        set({ isConnecting: true, error: null });
        try {
          const hasExtension = typeof window !== 'undefined' && !!window.ethereum;

          const connector = hasExtension
            ? injected()
            : walletConnect({
                projectId: appConfig.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
              });

          const result = await connect(config, { connector });
          const address = result.accounts[0];
          const chainId = result.chainId;

          const nonceData = await authService.getNonce({
            address,
            chain_id: chainId,
          });

          const message = buildSiweMessage({
            address,
            chainId,
            nonce: nonceData.nonce,
            domain: window.location.hostname,
            uri: window.location.origin,
            issuedAt: new Date().toISOString(),
          });

          const signature = await signMessage(config, { message });
          const authData = await authService.verifyWallet({
            message,
            signature,
          });

          setTokens(authData.access_token, authData.refresh_token);
          set({
            address,
            chainId,
            user: authData.user,
            isAuthenticated: true,
            authMethod: 'wallet',
            isConnecting: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to connect wallet';
          set({ isConnecting: false, error: message });
          throw error;
        }
      },

      disconnectWallet: async () => {
        try {
          await disconnect(config);
        } catch {
          // Ignore disconnect errors
        }
        clearTokens();
        set({
          address: null,
          chainId: null,
          user: null,
          isAuthenticated: false,
          authMethod: null,
          error: null,
        });
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // Ignore logout errors
        }
        try {
          await disconnect(config);
        } catch {
          // Ignore disconnect errors
        }
        clearTokens();
        set({
          user: null,
          address: null,
          chainId: null,
          isAuthenticated: false,
          authMethod: null,
        });
      },

      fetchUser: async () => {
        try {
          const user = await authService.getMe();
          set({ user, isAuthenticated: true });
        } catch {
          clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            authMethod: null,
          });
        }
      },

      initialize: async () => {
        const account = getAccount(config);
        if (account.address) {
          set({
            address: account.address,
            chainId: account.chainId ?? null,
          });
        }

        if (hasTokens()) {
          set({ isLoading: true });
          try {
            const user = await authService.getMe();
            set({
              user,
              isAuthenticated: true,
              authMethod: account.address ? 'wallet' : 'email',
              isInitialized: true,
              isLoading: false,
            });
          } catch {
            clearTokens();
            set({
              user: null,
              isAuthenticated: false,
              authMethod: null,
              isInitialized: true,
              isLoading: false,
            });
          }
        } else {
          set({ isInitialized: true });
        }
      },
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        address: state.address,
        chainId: state.chainId,
        authMethod: state.authMethod,
      }),
    },
  ),
);

export { formatAddress };
