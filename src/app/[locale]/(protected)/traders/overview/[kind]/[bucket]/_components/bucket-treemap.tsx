'use client';

import { useTranslations } from 'next-intl';
import { cn } from 'cn';
import { formatUsd } from '@/lib/trader-format';
import { squarify } from '@/lib/treemap';
import type { BucketDetail, BucketMarketTop, OverviewSentiment } from '@/types/trader';

export interface BucketTreemapProps {
  detail?: BucketDetail | null;
  markets?: BucketMarketTop[] | null;
  marketsTop?: BucketMarketTop[] | null;
  data?: BucketMarketTop[] | null;
}

const MAX_TILES = 12;
const SENTIMENTS: OverviewSentiment[] = [
  'very_bullish',
  'bullish',
  'slightly_bullish',
  'neutral',
  'slightly_bearish',
  'bearish',
  'very_bearish',
];

type TileTone = 'positive' | 'negative' | 'neutral';

const TONE_CLASS: Record<TileTone, string> = {
  positive: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-100',
  negative: 'bg-rose-500/15 border-rose-500/30 text-rose-100',
  neutral: 'bg-muted border-border text-muted-foreground',
};

function tileTone(upnl: number): TileTone {
  if (upnl > 0) return 'positive';
  if (upnl < 0) return 'negative';
  return 'neutral';
}

function signedUsd(value: number): string {
  if (value === 0) return formatUsd(0) ?? '$0.00';
  const sign = value > 0 ? '+' : '-';
  return `${sign}${formatUsd(Math.abs(value)) ?? '$0.00'}`;
}

export function BucketTreemap(props: BucketTreemapProps) {
  const t = useTranslations('traders.bucketDetail');
  const tOverview = useTranslations('traders.overview');
  const markets =
    props.markets ?? props.marketsTop ?? props.data ?? props.detail?.markets_top ?? [];
  const list = (Array.isArray(markets) ? markets : []).slice(0, MAX_TILES);

  const rects = squarify(
    list.map((market, index) => ({
      key: `${market.market}-${index}`,
      value: Number.isFinite(market.notional) ? market.notional : 0,
    })),
  );

  if (rects.length === 0) {
    return (
      <div
        data-testid="bucket-treemap"
        className="bg-card text-muted-foreground flex h-full min-h-[280px] w-full items-center justify-center rounded-xl border border-dashed p-4 text-sm"
      >
        {t('treemap.noData')}
      </div>
    );
  }

  const rectByKey = new Map(rects.map((rect) => [rect.key, rect]));

  const tiles = list.flatMap((market, index) => {
    const key = `${market.market}-${index}`;
    const rect = rectByKey.get(key);
    if (!rect) return [];
    const upnl = Number.isFinite(market.upnl) ? market.upnl : 0;
    const sentiment = String(market.sentiment ?? 'neutral');
    const sentimentLabel = SENTIMENTS.includes(sentiment as OverviewSentiment)
      ? tOverview(('sentiment.' + sentiment) as never)
      : sentiment.replace(/_/g, ' ');
    const area = rect.w * rect.h;
    return [
      {
        key,
        market: market.market,
        rect,
        upnl,
        sentimentLabel,
        area,
        tone: tileTone(upnl),
      },
    ];
  });

  return (
    <div
      data-testid="bucket-treemap"
      role="group"
      aria-label={t('treemap.title')}
      className="bg-card relative flex h-full w-full flex-col overflow-hidden rounded-xl border p-1"
    >
      <div className="relative min-h-[280px] flex-1">
        {tiles.map(({ key, market, rect, upnl, sentimentLabel, area, tone }) => {
          const showSentiment = area >= 0.05;
          const fontClass = area >= 0.12 ? 'text-sm' : area >= 0.04 ? 'text-xs' : 'text-[10px]';
          return (
            <div
              key={key}
              className="absolute"
              style={{
                left: `${rect.x * 100}%`,
                top: `${rect.y * 100}%`,
                width: `${rect.w * 100}%`,
                height: `${rect.h * 100}%`,
              }}
            >
              <div
                data-testid="treemap-tile"
                data-market={market}
                data-upnl={upnl}
                className={cn(
                  'absolute inset-[1px] flex flex-col justify-between overflow-hidden rounded-md border p-1.5',
                  TONE_CLASS[tone],
                )}
              >
                <div className="flex min-w-0 items-center gap-1">
                  <span className="border-background/30 bg-background/20 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px] font-semibold uppercase">
                    {market.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="truncate text-[11px] font-semibold uppercase">
                    {market.toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className={cn('truncate font-medium tabular-nums', fontClass)}>
                    {signedUsd(upnl)}{' '}
                    <span className="text-[9px] font-normal tracking-wide uppercase opacity-70">
                      {t('treemap.upnl')}
                    </span>
                  </div>
                  {showSentiment ? (
                    <div className="truncate text-[9px] opacity-80">{sentimentLabel}</div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BucketTreemap;
