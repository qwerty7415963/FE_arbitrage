'use client';

import { useWalletStore } from '@/lib/stores/wallet';
import { useTranslations } from 'next-intl';

export default function FundingArbitragePage() {
  const { address, isAuthenticated } = useWalletStore();
  const t = useTranslations('wallet');

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Funding Arbitrage</h1>
      {isAuthenticated && address ? (
        <p className="text-muted-foreground">
          {t('connectedAs')} <span className="font-mono">{address}</span>
        </p>
      ) : (
        <p className="text-muted-foreground">{t('connectToStart')}</p>
      )}
    </div>
  );
}
