import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  detectWallets,
  hasWallet,
  connectWallet,
  getChainId,
  signMessage,
  formatAddress,
} from '@/lib/wallet';

function mockEthereum(overrides: Record<string, unknown> = {}) {
  const ethereum = {
    isMetaMask: true,
    request: vi.fn(),
    ...overrides,
  };
  Object.defineProperty(window, 'ethereum', { value: ethereum, writable: true });
  return ethereum;
}

describe('wallet', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'ethereum', { value: undefined, writable: true });
  });

  describe('detectWallets', () => {
    it('returns empty array when no window', () => {
      expect(detectWallets()).toEqual([]);
    });

    it('detects MetaMask', () => {
      mockEthereum({ isMetaMask: true });
      const wallets = detectWallets();
      expect(wallets).toHaveLength(1);
      expect(wallets[0].type).toBe('metamask');
      expect(wallets[0].name).toBe('MetaMask');
    });

    it('detects Rabby', () => {
      mockEthereum({ isMetaMask: false, isRabby: true });
      const wallets = detectWallets();
      expect(wallets).toHaveLength(1);
      expect(wallets[0].type).toBe('rabby');
      expect(wallets[0].name).toBe('Rabby');
    });

    it('returns browser wallet when ethereum exists but no known type', () => {
      mockEthereum({ isMetaMask: false, isRabby: false });
      const wallets = detectWallets();
      expect(wallets).toHaveLength(1);
      expect(wallets[0].name).toBe('Browser Wallet');
    });

    it('returns empty array when no ethereum', () => {
      expect(detectWallets()).toEqual([]);
    });
  });

  describe('hasWallet', () => {
    it('returns false when no ethereum', () => {
      expect(hasWallet()).toBe(false);
    });

    it('returns true when ethereum exists', () => {
      mockEthereum();
      expect(hasWallet()).toBe(true);
    });
  });

  describe('connectWallet', () => {
    it('returns address and chainId', async () => {
      const ethereum = mockEthereum();
      ethereum.request
        .mockResolvedValueOnce(['0x1234567890abcdef1234567890abcdef12345678'])
        .mockResolvedValueOnce('0x1');

      const result = await connectWallet();
      expect(result.address).toBe('0x1234567890abcdef1234567890abcdef12345678');
      expect(result.chainId).toBe(1);
    });

    it('throws when no wallet', async () => {
      await expect(connectWallet()).rejects.toThrow('No wallet detected');
    });

    it('throws when no accounts returned', async () => {
      const ethereum = mockEthereum();
      ethereum.request.mockResolvedValueOnce([]);

      await expect(connectWallet()).rejects.toThrow('No accounts returned');
    });
  });

  describe('getChainId', () => {
    it('returns chain id as number', async () => {
      const ethereum = mockEthereum();
      ethereum.request.mockResolvedValueOnce('0x89');

      const result = await getChainId();
      expect(result).toBe(137);
    });

    it('throws when no wallet', async () => {
      await expect(getChainId()).rejects.toThrow('No wallet detected');
    });
  });

  describe('signMessage', () => {
    it('returns signature', async () => {
      const ethereum = mockEthereum();
      ethereum.request.mockResolvedValueOnce(['0x1234']).mockResolvedValueOnce('0xsignature');

      const result = await signMessage('hello');
      expect(result).toBe('0xsignature');
      expect(ethereum.request).toHaveBeenCalledWith({
        method: 'personal_sign',
        params: ['hello', '0x1234'],
      });
    });

    it('throws when no wallet', async () => {
      await expect(signMessage('hello')).rejects.toThrow('No wallet detected');
    });

    it('throws when no accounts', async () => {
      const ethereum = mockEthereum();
      ethereum.request.mockResolvedValueOnce([]);

      await expect(signMessage('hello')).rejects.toThrow('No accounts connected');
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
