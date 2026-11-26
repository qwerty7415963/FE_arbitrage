'use client';

import { useTranslations } from 'next-intl';
import { AssetIcon } from '@/components/shared/asset-icon';
import { formatPrice, formatUsd } from '@/lib/trader-format';
import type { MarketDetailHeader, MarketDetailResponse } from '@/types/trader';

export interface MarketHeaderProps {
  header?: MarketDetailHeader | null;
  data?: MarketDetailResponse | null;
  detail?: MarketDetailResponse | null;
  market?: string;
  venue?: string;
}

export function MarketHeader(props: MarketHeaderProps) {
  const t = useTranslations('traders');
  const header = props.header ?? props.data?.header ?? props.detail?.header ?? null;
  const market = props.market ?? header?.market ?? '';
  const markPrice = formatPrice(header?.mark_price);
  const indexPrice = formatPrice(header?.index_price);
  const marketOi = formatUsd(header?.market_oi);
  return (
    <div
      data-testid="market-header"
      className="bg-surface border-border-subtle rounded-xl border p-4"
    >
      <div className="flex items-center gap-2">
        <AssetIcon
          symbol={market}
          logoUrl={header?.logo_url}
          category={header?.category}
          size={24}
        />
        <h1 className="text-lg font-semibold">{market}</h1>
        {header?.venue && (
          <span className="bg-muted rounded px-2 py-0.5 text-xs">{header.venue}</span>
        )}
        {header?.category && (
          <span className="text-muted-foreground text-xs">{header.category}</span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-6">
        <div>
          <span className="text-muted-foreground text-xs">{t('marketDetail.markPrice')} (USD)</span>
          <div className="text-2xl font-semibold tabular-nums">{markPrice ?? '�?"'}</div>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">{t('marketDetail.indexPrice')}:</span>{' '}
          {indexPrice ?? '�?"'}
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">{t('marketDetail.fundingRate')}:</span>{' '}
          {header?.funding_rate ?? '�?"'}
        </div>
        {header?.next_funding_at && (
          <div className="text-sm">
            <span className="text-muted-foreground">{t('marketDetail.nextFunding')}:</span>{' '}
            {header.next_funding_at}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t('marketDetail.marketOi')}:</span>
        <span className="font-medium">{marketOi ?? '�?"'}</span>
        <span className="bg-warning-subtle text-warning rounded px-1 text-[11px]">HL · 30s</span>
      </div>
    </div>
  );
}
