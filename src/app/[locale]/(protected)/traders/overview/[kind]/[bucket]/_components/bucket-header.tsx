'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeftIcon } from 'lucide-react';
import { cn } from 'cn';
import { Link } from '@/i18n/navigation';
import type { BucketDetail, BucketKind, BucketRange, OverviewSentiment } from '@/types/trader';

export interface BucketHeaderProps {
  kind?: BucketKind | string;
  bucket?: string;
  bucketId?: string;
  id?: string;
  title?: string;
  name?: string;
  sentiment?: OverviewSentiment | string | null;
  walletCount?: number;
  wallet_count?: number;
  backHref?: string;
  detail?: BucketDetail | null;
  range?: BucketRange | string;
  onRangeChange?: (range: string) => void;
}

const RANGES: BucketRange[] = ['24H', '7D', '30D'];

export function BucketHeader(props: BucketHeaderProps) {
  const t = useTranslations('traders.bucketDetail');
  const tOverview = useTranslations('traders.overview');
  const locale = useLocale();
  const detail = props.detail ?? null;
  const bucketId = props.bucket ?? props.bucketId ?? props.id ?? detail?.bucket_id ?? '';
  const bucketLabelKey = 'bucketLabels.' + bucketId;
  const fullBucketLabelKey = 'traders.overview.' + bucketLabelKey;
  const rawTranslatedTitle = bucketId ? tOverview(bucketLabelKey as never) : '';
  const translatedTitle =
    rawTranslatedTitle && rawTranslatedTitle !== fullBucketLabelKey ? rawTranslatedTitle : null;
  const humanizedTitle = bucketId
    ? bucketId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : '';
  const title =
    props.title ?? props.name ?? translatedTitle ?? (bucketId ? humanizedTitle : '') ?? bucketId;
  const sentiment = props.sentiment ?? detail?.sentiment ?? 'neutral';
  const walletCount = props.walletCount ?? props.wallet_count ?? detail?.wallet_count ?? 0;
  const backHref =
    (props.backHref ?? '/traders/overview').replace(new RegExp(`^/${locale}(?=/|$)`), '') ||
    '/traders/overview';
  const range = String(props.range ?? '30D');

  function sentimentColor(s: string) {
    if (s === 'very_bullish' || s === 'bullish' || s === 'slightly_bullish') return 'emerald';
    if (s === 'very_bearish' || s === 'bearish' || s === 'slightly_bearish') return 'rose';
    return 'muted';
  }
  const color = sentimentColor(String(sentiment));

  return (
    <div data-testid="bucket-header" className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Link
          href={backHref}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('back')}
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <span
            className={
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ' +
              (color === 'emerald'
                ? 'bg-financial-positive-subtle text-financial-positive'
                : color === 'rose'
                  ? 'bg-financial-negative-subtle text-financial-negative'
                  : 'bg-muted text-muted-foreground')
            }
            data-testid="sentiment-badge"
          >
            {t(('sentiment.' + sentiment) as never)}
          </span>
          <span className="text-muted-foreground text-sm" data-testid="wallet-count">
            {walletCount} {t('walletCount')}
          </span>
        </div>
        <div
          className="border-input bg-background inline-flex overflow-hidden rounded-lg border"
          role="group"
          aria-label={t('range')}
        >
          {RANGES.map((value) => {
            const active = range === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => props.onRangeChange?.(value)}
                className={cn(
                  'px-2 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {value}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
