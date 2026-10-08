import { DEFAULT_WALLET_TAB, WALLET_TABS, type WalletTabId } from '@/types/trader';

export function isWalletTab(value: unknown): value is WalletTabId {
  return typeof value === 'string' && (WALLET_TABS as string[]).includes(value);
}

export function parseWalletTabParam(raw: string | null | undefined): WalletTabId {
  if (raw && isWalletTab(raw)) return raw;
  return DEFAULT_WALLET_TAB;
}

export function buildWalletTabParams(tab: WalletTabId, current?: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(current?.toString() ?? '');
  if (tab === DEFAULT_WALLET_TAB) {
    params.delete('tab');
  } else {
    params.set('tab', tab);
  }
  return params;
}
