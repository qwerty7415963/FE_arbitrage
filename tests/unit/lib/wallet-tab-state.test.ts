import { describe, it, expect } from 'vitest';
import { buildWalletTabParams, isWalletTab, parseWalletTabParam } from '@/lib/wallet-tab-state';
import { DEFAULT_WALLET_TAB, WALLET_TABS } from '@/types/trader';

describe('wallet-tab-state', () => {
  it('exposes nine tabs in contract order with positions default', () => {
    expect(WALLET_TABS).toEqual([
      'positions',
      'balances',
      'predictions',
      'orders',
      'fills',
      'trades',
      'swap',
      'transfers',
      'performance',
    ]);
    expect(DEFAULT_WALLET_TAB).toBe('positions');
  });

  it('accepts every contract tab id', () => {
    for (const tab of WALLET_TABS) {
      expect(isWalletTab(tab)).toBe(true);
    }
    expect(isWalletTab('swap')).toBe(true);
    expect(isWalletTab('predictions')).toBe(true);
  });

  it('rejects unknown tab ids', () => {
    expect(isWalletTab('funding')).toBe(false);
    expect(isWalletTab('')).toBe(false);
    expect(isWalletTab(null)).toBe(false);
    expect(isWalletTab(undefined)).toBe(false);
  });

  it('parses a valid ?tab= value', () => {
    expect(parseWalletTabParam('trades')).toBe('trades');
    expect(parseWalletTabParam('performance')).toBe('performance');
  });

  it('falls back to positions for missing or invalid values', () => {
    expect(parseWalletTabParam(null)).toBe('positions');
    expect(parseWalletTabParam(undefined)).toBe('positions');
    expect(parseWalletTabParam('')).toBe('positions');
    expect(parseWalletTabParam('funding')).toBe('positions');
  });

  it('sets ?tab= for non-default tabs', () => {
    expect(buildWalletTabParams('trades').get('tab')).toBe('trades');
    expect(buildWalletTabParams('swap').get('tab')).toBe('swap');
  });

  it('omits ?tab= for the default positions tab', () => {
    expect(buildWalletTabParams('positions').has('tab')).toBe(false);
    expect(buildWalletTabParams('positions', new URLSearchParams('tab=trades')).has('tab')).toBe(
      false,
    );
  });

  it('preserves sibling params when switching tabs', () => {
    const params = buildWalletTabParams('fills', new URLSearchParams('period=7D'));
    expect(params.get('tab')).toBe('fills');
    expect(params.get('period')).toBe('7D');
  });
});
