declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      isRabby?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

export type WalletType = 'metamask' | 'rabby' | 'walletconnect';

export interface WalletInfo {
  type: WalletType;
  name: string;
  detected: boolean;
}

export function detectWallets(): WalletInfo[] {
  if (typeof window === 'undefined') return [];

  const wallets: WalletInfo[] = [];

  if (window.ethereum?.isMetaMask) {
    wallets.push({ type: 'metamask', name: 'MetaMask', detected: true });
  }

  if (window.ethereum?.isRabby) {
    wallets.push({ type: 'rabby', name: 'Rabby', detected: true });
  }

  if (wallets.length === 0 && window.ethereum) {
    wallets.push({ type: 'metamask', name: 'Browser Wallet', detected: true });
  }

  return wallets;
}

export function hasWallet(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.ethereum;
}

export async function connectWallet(): Promise<{ address: string; chainId: number }> {
  if (!window.ethereum) {
    throw new Error('No wallet detected');
  }

  const accounts = (await window.ethereum.request({
    method: 'eth_requestAccounts',
  })) as string[];

  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts returned');
  }

  const chainIdHex = (await window.ethereum.request({
    method: 'eth_chainId',
  })) as string;

  return {
    address: accounts[0],
    chainId: parseInt(chainIdHex, 16),
  };
}

export async function getChainId(): Promise<number> {
  if (!window.ethereum) {
    throw new Error('No wallet detected');
  }

  const chainIdHex = (await window.ethereum.request({
    method: 'eth_chainId',
  })) as string;

  return parseInt(chainIdHex, 16);
}

export async function signMessage(message: string): Promise<string> {
  if (!window.ethereum) {
    throw new Error('No wallet detected');
  }

  const accounts = (await window.ethereum.request({
    method: 'eth_accounts',
  })) as string[];

  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts connected');
  }

  const signature = (await window.ethereum.request({
    method: 'personal_sign',
    params: [message, accounts[0]],
  })) as string;

  return signature;
}

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
