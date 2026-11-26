'use client';

import { useTranslations } from 'next-intl';
import { cn } from 'cn';
import { formatUsd } from '@/lib/trader-format';
import { squarify } from '@/lib/treemap';
import { AssetIcon } from '@/components/shared/asset-icon';
import { stripDexPrefix } from '@/lib/asset-meta';
import { useElementSize } from '@/hooks/use-element-size';
import type { BucketDetail, BucketMarketTop, OverviewSentiment } from '@/types/trader';

export interface BucketTreemapProps {
  detail?: BucketDetail | null;
  markets?: BucketMarketTop[] | null;
  marketsTop?: BucketMarketTop[] | null;
  data?: BucketMarketTop[] | null;
}

const MAX_TILES = 8;
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
  positive: 'bg-financial-positive-subtle border-financial-positive/30 text-financial-positive',
  negative: 'bg-financial-negative-subtle border-financial-negative/30 text-financial-negative',
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

interface TileData {
  key: string;
  market: string;
  display: string;
  rect: { x: number; y: number; w: number; h: number };
  upnl: number;
  notional: number;
  traders: number;
  sentimentLabel: string;
  area: number;
  tone: TileTone;
  tradfi: boolean;
  logoUrl: string | null;
  category: string;
  index: number;
}

interface LevelStyle {
  iconSize: number;
  showIcon: boolean;
  symbolClass: string | null;
  upnlClass: string | null;
  sentimentClass: string | null;
  padding: string;
  showSymbol: boolean;
  showUpnl: boolean;
  showSentiment: boolean;
  watermark: boolean;
}

function resolveLevel(wpx: number, hpx: number, area: number, hasSize: boolean): LevelStyle {
  if (hasSize) {
    if (wpx >= 300 && hpx >= 140)
      return {
        iconSize: 26,
        showIcon: true,
        symbolClass: 'text-base',
        upnlClass: 'text-sm',
        sentimentClass: 'text-xs',
        padding: 'p-3',
        showSymbol: true,
        showUpnl: true,
        showSentiment: true,
        watermark: true,
      };
    if (wpx >= 220 && hpx >= 100)
      return {
        iconSize: 20,
        showIcon: true,
        symbolClass: 'text-base',
        upnlClass: 'text-sm',
        sentimentClass: 'text-xs',
        padding: 'p-2.5',
        showSymbol: true,
        showUpnl: true,
        showSentiment: true,
        watermark: true,
      };
    if (wpx >= 140 && hpx >= 64)
      return {
        iconSize: 14,
        showIcon: true,
        symbolClass: 'text-sm',
        upnlClass: 'text-xs',
        sentimentClass: 'text-[11px]',
        padding: 'p-2',
        showSymbol: true,
        showUpnl: true,
        showSentiment: true,
        watermark: false,
      };
    if (wpx >= 90 && hpx >= 40)
      return {
        iconSize: 14,
        showIcon: true,
        symbolClass: 'text-xs',
        upnlClass: 'text-[11px]',
        sentimentClass: null,
        padding: 'p-1.5',
        showSymbol: true,
        showUpnl: true,
        showSentiment: false,
        watermark: false,
      };
    if (wpx >= 48)
      return {
        iconSize: 14,
        showIcon: true,
        symbolClass: null,
        upnlClass: null,
        sentimentClass: null,
        padding: 'p-1.5',
        showSymbol: false,
        showUpnl: false,
        showSentiment: false,
        watermark: false,
      };
    return {
      iconSize: 0,
      showIcon: false,
      symbolClass: null,
      upnlClass: null,
      sentimentClass: null,
      padding: 'p-1.5',
      showSymbol: false,
      showUpnl: false,
      showSentiment: false,
      watermark: false,
    };
  }
  if (area >= 0.15)
    return {
      iconSize: 14,
      showIcon: true,
      symbolClass: 'text-[11px]',
      upnlClass: 'text-xs',
      sentimentClass: 'text-[11px]',
      padding: 'p-1.5',
      showSymbol: true,
      showUpnl: true,
      showSentiment: true,
      watermark: false,
    };
  if (area >= 0.05)
    return {
      iconSize: 14,
      showIcon: true,
      symbolClass: 'text-[11px]',
      upnlClass: 'text-xs',
      sentimentClass: null,
      padding: 'p-1.5',
      showSymbol: true,
      showUpnl: true,
      showSentiment: false,
      watermark: false,
    };
  if (area >= 0.02)
    return {
      iconSize: 14,
      showIcon: true,
      symbolClass: 'text-[11px]',
      upnlClass: null,
      sentimentClass: null,
      padding: 'p-1.5',
      showSymbol: true,
      showUpnl: false,
      showSentiment: false,
      watermark: false,
    };
  return {
    iconSize: 0,
    showIcon: false,
    symbolClass: null,
    upnlClass: null,
    sentimentClass: null,
    padding: 'p-1.5',
    showSymbol: false,
    showUpnl: false,
    showSentiment: false,
    watermark: false,
  };
}

export function BucketTreemap(props: BucketTreemapProps) {
  const t = useTranslations('traders.bucketDetail');
  const tOverview = useTranslations('traders.overview');
  const markets =
    props.markets ?? props.marketsTop ?? props.data ?? props.detail?.markets_top ?? [];
  const list = Array.isArray(markets) ? markets : [];
  const marketsSource = props.detail?.markets_source ?? 'positions';
  const sourceLabel =
    marketsSource === 'trades' ? t('treemap.sourceTrades') : t('treemap.sourcePositions');

  const sorted = [...list].sort((a, b) => (b.notional ?? 0) - (a.notional ?? 0));

  const top = sorted.slice(0, MAX_TILES);
  const rest = sorted.slice(MAX_TILES);

  const otherNotional = rest.reduce(
    (s, m) => s + (Number.isFinite(m.notional) ? m.notional : 0),
    0,
  );
  const otherUpnl = rest.reduce((s, m) => s + (Number.isFinite(m.upnl) ? m.upnl : 0), 0);
  const otherTraders = rest.reduce((s, m) => s + (Number.isFinite(m.traders) ? m.traders : 0), 0);

  const items: { key: string; value: number; market: BucketMarketTop | null; isOther: boolean }[] =
    top.map((market, index) => ({
      key: `${market.market}-${index}`,
      value: Number.isFinite(market.notional) ? market.notional : 0,
      market,
      isOther: false,
    }));

  if (rest.length > 0) {
    items.push({
      key: '__other__',
      value: otherNotional > 0 ? otherNotional : 1,
      market: null,
      isOther: true,
    });
  }

  const rects = squarify(
    items.map((it) => ({ key: it.key, value: it.value })),
    1,
    1,
  );

  const {
    ref: containerRef,
    width: containerWidth,
    height: containerHeight,
  } = useElementSize<HTMLDivElement>();

  if (rects.length === 0) {
    return (
      <div
        data-testid="bucket-treemap"
        className="bg-surface text-muted-foreground flex h-full min-h-[300px] w-full flex-col items-center justify-center rounded-xl border border-dashed p-4 text-sm lg:min-h-[360px]"
      >
        {t('treemap.noData')}
      </div>
    );
  }

  const rectByKey = new Map(rects.map((rect) => [rect.key, rect]));

  const tiles: TileData[] = items.flatMap((it, idx) => {
    const rect = rectByKey.get(it.key);
    if (!rect) return [];
    let marketFull: string;
    let upnl: number;
    let notional: number;
    let traders: number;
    let sentimentRaw: string;
    let logoUrl: string | null = null;
    let category = '';
    if (it.isOther) {
      marketFull = t('treemap.other');
      upnl = otherUpnl;
      notional = otherNotional;
      traders = otherTraders;
      sentimentRaw = otherUpnl > 0 ? 'bullish' : otherUpnl < 0 ? 'bearish' : 'neutral';
    } else {
      const m = it.market as BucketMarketTop;
      marketFull = m.market;
      upnl = Number.isFinite(m.upnl) ? m.upnl : 0;
      notional = Number.isFinite(m.notional) ? m.notional : 0;
      traders = Number.isFinite(m.traders) ? m.traders : 0;
      sentimentRaw = String(m.sentiment ?? 'neutral');
      logoUrl = m.logo_url ?? null;
      category = m.asset_category ?? '';
    }
    const sentimentLabel = SENTIMENTS.includes(sentimentRaw as OverviewSentiment)
      ? tOverview(('sentiment.' + sentimentRaw) as never)
      : sentimentRaw.replace(/_/g, ' '); // fallback: sentiment value not in known set, humanize snake_case
    const area = rect.w * rect.h;
    const tradfi = marketFull.toUpperCase().startsWith('XYZ:');
    const display = it.isOther ? t('treemap.other') : stripDexPrefix(marketFull);
    return [
      {
        key: it.key,
        market: marketFull,
        display,
        rect,
        upnl,
        notional,
        traders,
        sentimentLabel,
        area,
        tone: tileTone(upnl),
        tradfi,
        logoUrl,
        category,
        index: idx,
      },
    ];
  });

  const tooltip = (tile: TileData) =>
    `${tile.market} — ${t('treemap.notional')} ${formatUsd(tile.notional) ?? tile.notional}, ${marketsSource === 'trades' ? t('treemap.realizedPnl') : t('treemap.upnl')} ${signedUsd(tile.upnl)}, ${tile.sentimentLabel}, ${t('treemap.traders')} ${tile.traders} (${t('treemap.source')}: ${sourceLabel})`;

  const hasSize = containerWidth > 0 && containerHeight > 0;

  const preloadUrls = top
    .map((m) => m.logo_url)
    .filter((u): u is string => !!u)
    .slice(0, 8);

  return (
    <div
      data-testid="bucket-treemap"
      role="group"
      aria-label={t('treemap.title')}
      className="bg-surface border-border-subtle relative flex h-full w-full flex-col overflow-hidden rounded-xl border p-1"
    >
      {preloadUrls.map((href) => (
        <link key={href} rel="preload" as="image" href={href} />
      ))}
      <div
        ref={containerRef}
        className="relative min-h-[300px] flex-1 overflow-hidden lg:min-h-[360px]"
      >
        {tiles.map((tile) => {
          const {
            key,
            market,
            display,
            rect,
            upnl,
            sentimentLabel,
            area,
            tone,
            tradfi,
            logoUrl,
            category,
            index,
          } = tile;
          const wpx = hasSize ? rect.w * containerWidth : 0;
          const hpx = hasSize ? rect.h * containerHeight : 0;
          const level = resolveLevel(wpx, hpx, area, hasSize);
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
                title={tooltip(tile)}
                className={cn(
                  'absolute inset-[1px] flex flex-col justify-between overflow-hidden rounded-md border',
                  level.padding,
                  TONE_CLASS[tone],
                )}
              >
                {(level.showIcon || level.showSymbol) && (
                  <div className="flex min-w-0 items-center gap-1">
                    {level.showIcon && (
                      <AssetIcon
                        symbol={market}
                        logoUrl={logoUrl}
                        category={category}
                        size={level.iconSize}
                        loading={index < 8 ? 'eager' : 'lazy'}
                      />
                    )}
                    {level.showSymbol && (
                      <span className={cn('truncate font-semibold uppercase', level.symbolClass)}>
                        {display}
                      </span>
                    )}
                    {tradfi && level.showSymbol && (
                      <span className="bg-foreground/10 shrink-0 rounded px-1 text-[11px] font-medium tracking-wide uppercase">
                        {t('treemap.tradfi')}
                      </span>
                    )}
                  </div>
                )}
                {level.showUpnl && (
                  <div className="min-w-0">
                    <div className={cn('truncate font-medium tabular-nums', level.upnlClass)}>
                      {signedUsd(upnl)}{' '}
                      <span className="text-[11px] font-normal tracking-wide uppercase opacity-70">
                        {marketsSource === 'trades' ? t('treemap.realizedPnl') : t('treemap.upnl')}
                      </span>
                    </div>
                    {level.showSentiment && (
                      <div className={cn('truncate opacity-80', level.sentimentClass)}>
                        {sentimentLabel}
                      </div>
                    )}
                  </div>
                )}
                {level.watermark && logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    className="pointer-events-none absolute right-1 bottom-1 opacity-[0.06]"
                    style={{
                      width: level.iconSize + 4,
                      height: level.iconSize + 4,
                      objectFit: 'contain',
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BucketTreemap;
