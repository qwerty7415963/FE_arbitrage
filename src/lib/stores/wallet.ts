import { create } from 'zustand';
import { connect, disconnect, getAccount, signMessage } from 'wagmi/actions';
import { metaMask } from 'wagmi/connectors';
import { config } from '@/lib/wagmi';
import * as authService from '@/services/auth';
import { setTokens, clearTokens } from '@/lib/token';

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

interface WalletState {
  address: string | null;
  chainId: number | null;
  isAuthenticated: boolean;
  isConnecting: boolean;
  error: string | null;

  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  syncFromWagmi: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  chainId: null,
  isAuthenticated: false,
  isConnecting: false,
  error: null,

  connect: async () => {
    set({ isConnecting: true, error: null });
    try {
      const result = await connect(config, { connector: metaMask() });

      const address = result.accounts[0];
      const chainId = result.chainId;

      const nonceData = await authService.getNonce({
        address,
        chain_id: chainId,
      });

      const domain = window.location.origin;
      const uri = window.location.origin;
      const issuedAt = new Date().toISOString();

      const message = buildSiweMessage({
        address,
        chainId,
        nonce: nonceData.nonce,
        domain,
        uri,
        issuedAt,
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
        isAuthenticated: true,
        isConnecting: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect wallet';
      set({ isConnecting: false, error: message });
      throw error;
    }
  },

  disconnect: async () => {
    try {
      await disconnect(config);
    } catch {
      // Ignore disconnect errors
    }
    clearTokens();
    set({
      address: null,
      chainId: null,
      isAuthenticated: false,
      error: null,
    });
  },

  syncFromWagmi: () => {
    const account = getAccount(config);
    if (account.address) {
      set({
        address: account.address,
        chainId: account.chainId ?? null,
      });
    }
  },
}));

export { formatAddress };
