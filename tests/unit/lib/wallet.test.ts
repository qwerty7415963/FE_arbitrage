import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatAddress } from '@/lib/stores/wallet';

vi.mock('wagmi/actions', () => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  getAccount: vi.fn(),
  signMessage: vi.fn(),
}));

vi.mock('@/lib/wagmi', () => ({
  config: {},
}));

vi.mock('@/services/auth', () => ({
  getNonce: vi.fn(),
  verifyWallet: vi.fn(),
}));

vi.mock('@/lib/token', () => ({
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
}));

describe('wallet store', () => {
  describe('formatAddress', () => {
    it('formats address with ellipsis', () => {
      expect(formatAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe('0x1234...5678');
    });

    it('returns empty string for empty address', () => {
      expect(formatAddress('')).toBe('');
    });
  });
});
