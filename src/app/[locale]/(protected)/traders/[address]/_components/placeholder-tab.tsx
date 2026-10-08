'use client';

import { useTranslations } from 'next-intl';

export function PlaceholderTab({ kind }: { kind: 'predictions' | 'swap' }) {
  const t = useTranslations('traders');
  const titleKey = kind === 'predictions' ? 'predictionsSoon' : 'swapSoon';
  const descKey = kind === 'predictions' ? 'predictionsSoonDesc' : 'swapSoonDesc';
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-4">
      <p className="text-sm font-semibold">{t(titleKey)}</p>
      <p className="text-muted-foreground text-sm">{t(descKey)}</p>
    </div>
  );
}
