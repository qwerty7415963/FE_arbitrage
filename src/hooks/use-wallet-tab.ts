'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DEFAULT_WALLET_TAB, type WalletTabId } from '@/types/trader';
import { buildWalletTabParams, parseWalletTabParam } from '@/lib/wallet-tab-state';

export interface UseWalletTabResult {
  tab: WalletTabId;
  setTab: (tab: WalletTabId) => void;
}

export function useWalletTab(): UseWalletTabResult {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = parseWalletTabParam(searchParams.get('tab'));

  const setTab = useCallback(
    (next: WalletTabId) => {
      const params = buildWalletTabParams(next, searchParams);
      const qs = params.toString();
      if (
        next === DEFAULT_WALLET_TAB &&
        !searchParams.get('tab') &&
        qs === searchParams.toString()
      ) {
        return;
      }
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  return { tab, setTab };
}
