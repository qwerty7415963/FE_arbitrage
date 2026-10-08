'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from 'cn';
import { useWalletTab } from '@/hooks/use-wallet-tab';
import { useTraderPositions } from '@/hooks/use-trader-positions';
import {
  DEFAULT_POSITION_DIR,
  DEFAULT_POSITION_SORT,
  WALLET_TABS,
  type PositionSortKey,
  type SortDirection,
  type WalletTabId,
} from '@/types/trader';
import { PositionsSection } from './positions-section';
import { BalancesSection } from './balances-section';
import { OrdersSection } from './orders-section';
import { FillsSection } from './fills-section';
import { TradesSection } from './trades-section';
import { TransfersSection } from './transfers-section';
import { PerformanceSection } from './performance-section';
import { PlaceholderTab } from './placeholder-tab';

export interface WalletTabsProps {
  walletAddress: string;
}

const TAB_LABEL_KEYS: Record<WalletTabId, string> = {
  positions: 'tabPositions',
  balances: 'tabBalances',
  predictions: 'tabPredictions',
  orders: 'tabOrders',
  fills: 'tabFills',
  trades: 'tabTrades',
  swap: 'tabSwap',
  transfers: 'tabTransfers',
  performance: 'tabPerformance',
};

export function WalletTabs({ walletAddress }: WalletTabsProps) {
  const t = useTranslations('traders');
  const { tab, setTab } = useWalletTab();
  const [positionSort, setPositionSort] = useState<PositionSortKey>(DEFAULT_POSITION_SORT);
  const [positionDir, setPositionDir] = useState<SortDirection>(DEFAULT_POSITION_DIR);

  const positions = useTraderPositions(walletAddress, {
    sort: positionSort,
    dir: positionDir,
    enabled: tab === 'positions',
  });

  function handlePositionSort(next: PositionSortKey) {
    if (next === positionSort) {
      setPositionDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setPositionSort(next);
      setPositionDir('asc');
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1" role="tablist" aria-label={t('walletTabs')}>
        {WALLET_TABS.map((tabId) => {
          const active = tab === tabId;
          return (
            <button
              key={tabId}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`wallet-panel-${tabId}`}
              id={`wallet-tab-${tabId}`}
              onClick={() => setTab(tabId)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm font-medium',
                active
                  ? 'bg-primary text-primary-foreground border-transparent'
                  : 'border-input bg-background hover:bg-muted',
              )}
            >
              {t(TAB_LABEL_KEYS[tabId])}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`wallet-panel-${tab}`} aria-labelledby={`wallet-tab-${tab}`}>
        {tab === 'positions' && (
          <PositionsSection
            snapshot={positions.snapshot}
            isLoading={positions.isLoading}
            error={positions.error}
            onRetry={() => positions.refetch()}
            sort={positionSort}
            dir={positionDir}
            onSortChange={handlePositionSort}
          />
        )}
        {tab === 'balances' && <BalancesSection walletAddress={walletAddress} enabled />}
        {tab === 'predictions' && <PlaceholderTab kind="predictions" />}
        {tab === 'orders' && <OrdersSection walletAddress={walletAddress} enabled />}
        {tab === 'fills' && <FillsSection walletAddress={walletAddress} enabled />}
        {tab === 'trades' && <TradesSection walletAddress={walletAddress} enabled />}
        {tab === 'swap' && <PlaceholderTab kind="swap" />}
        {tab === 'transfers' && <TransfersSection walletAddress={walletAddress} enabled />}
        {tab === 'performance' && <PerformanceSection walletAddress={walletAddress} enabled />}
      </div>
    </div>
  );
}
