'use client';

import { useIsMobile } from '@/hooks/use-is-mobile';

import { useTranslations } from 'next-intl';
import type { ArbitragePair } from '@/types/funding-arbitrage';
import { AssetIcon } from '@/components/shared/asset-icon';
import { stripDexPrefix } from '@/lib/asset-meta';
import {
  formatApr,
  formatFundingRate,
  formatFundingSpread,
  formatInterval,
  formatPriceSpread,
  formatUsd,
  resolveLongShort,
} from '@/lib/funding-format';

interface FundingMobileListProps {
  pairs: ArbitragePair[] | undefined | null;
}

export function FundingMobileList({ pairs }: FundingMobileListProps) {
  const t = useTranslations('fundingArbitrage');
  const isMobile = useIsMobile();
  if (!isMobile) return null;
  const rows: Array<{
    symbol: string;
    longVenue: string;
    shortVenue: string;
    longFunding: string;
    longInterval: string;
    shortFunding: string;
    shortInterval: string;
    spread: string;
    apr: string;
    oiA: string | null;
    oiB: string | null;
    priceSpread: string;
  }> = [];

  for (const pair of pairs ?? []) {
    for (const token of pair.tokens ?? []) {
      const longShort = resolveLongShort(
        token.long_venue_id,
        pair.venue_a?.id ?? '',
        pair.venue_b?.id ?? '',
      );
      const aIsLong = longShort === null ? true : longShort === 'A';
      const longVenueName = aIsLong ? (pair.venue_a?.name ?? '—') : (pair.venue_b?.name ?? '—');
      const shortVenueName = aIsLong ? (pair.venue_b?.name ?? '—') : (pair.venue_a?.name ?? '—');
      const longFunding = aIsLong
        ? formatFundingRate(token.venue_a_funding_rate)
        : formatFundingRate(token.venue_b_funding_rate);
      const longInterval = aIsLong
        ? formatInterval(token.venue_a_interval_seconds)
        : formatInterval(token.venue_b_interval_seconds);
      const shortFunding = aIsLong
        ? formatFundingRate(token.venue_b_funding_rate)
        : formatFundingRate(token.venue_a_funding_rate);
      const shortInterval = aIsLong
        ? formatInterval(token.venue_b_interval_seconds)
        : formatInterval(token.venue_a_interval_seconds);
      rows.push({
        symbol: token.symbol,
        longVenue: longVenueName,
        shortVenue: shortVenueName,
        longFunding,
        longInterval,
        shortFunding,
        shortInterval,
        spread: formatFundingSpread(token.rate_1h_percent),
        apr: formatApr(token.apr_percent),
        oiA: formatUsd(token.venue_a_oi),
        oiB: formatUsd(token.venue_b_oi),
        priceSpread: formatPriceSpread(token.price_spread_percent),
      });
    }
  }

  if (rows.length === 0) {
    return <div className="text-muted-foreground py-8 text-center lg:hidden">{t('empty')}</div>;
  }

  return (
    <ul className="flex flex-col gap-2 lg:hidden">
      {rows.map((row, idx) => (
        <li
          key={`${row.symbol}-${idx}`}
          className="bg-surface border-border-subtle rounded-xl border p-3"
        >
          <div className="flex items-center gap-2">
            <AssetIcon symbol={stripDexPrefix(row.symbol)} size={16} />
            <span className="font-semibold">{row.symbol}</span>
            <span className="text-muted-foreground ml-auto text-sm tabular-nums">{row.apr}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground block">{t('headers.fundingSpread')}</span>
              <span className="font-medium tabular-nums">{row.spread}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">{t('headers.priceSpread')}</span>
              <span className="font-medium tabular-nums">{row.priceSpread}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Long · {row.longVenue}</span>
              <span className="font-medium tabular-nums">
                {row.longFunding} ({row.longInterval})
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Short · {row.shortVenue}</span>
              <span className="font-medium tabular-nums">
                {row.shortFunding} ({row.shortInterval})
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
