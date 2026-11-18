import { TrendingUpIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import type {
  OverviewAccountBucket,
  OverviewBucket,
  OverviewPoint,
  OverviewSentiment,
} from '@/types/trader';
import { formatUsd } from '@/lib/trader-format';
import { OverviewSparkline } from './overview-sparkline';
import { Skeleton } from '@/components/ui/skeleton';

type Bucket = OverviewBucket | OverviewAccountBucket;

export interface OverviewCardProps {
  icon?: LucideIcon;
  Icon?: LucideIcon;
  bucket?: Bucket;
  title?: string;
  subtitle?: string;
  threshold?: string;
  sentiment?: OverviewSentiment | string | null;
  walletCount?: number;
  wallet_count?: number;
  series?: OverviewPoint[] | null;
  seriesLoading?: boolean;
  longNotional?: number;
  shortNotional?: number;
  longRatio?: number;
  long_count?: number;
  short_count?: number;
  long_notional?: number;
  short_notional?: number;
  long_ratio?: number;
  className?: string;
  kind?: string;
}

function isPnlBucket(b: Bucket): b is OverviewBucket {
  return (
    (b as OverviewBucket).sentiment !== undefined && (b as OverviewBucket).pnl_total !== undefined
  );
}

function sentimentColor(s: string | null | undefined): string {
  switch (s) {
    case 'very_bullish':
    case 'bullish':
    case 'slightly_bullish':
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
    case 'very_bearish':
    case 'bearish':
    case 'slightly_bearish':
      return 'bg-rose-500/15 text-rose-600 dark:text-rose-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function OverviewCard(props: OverviewCardProps) {
  const t = useTranslations('traders.overview');
  const Icon: LucideIcon = props.icon ?? props.Icon ?? TrendingUpIcon;
  const bucket = props.bucket;
  const pnlBucket = bucket && isPnlBucket(bucket) ? bucket : null;
  const accountBucket = bucket && !isPnlBucket(bucket) ? (bucket as OverviewAccountBucket) : null;
  const bucketLabel = bucket ? t(('bucketLabels.' + bucket.id) as never) : '';
  const title = props.title ?? (bucket ? bucketLabel : '') ?? bucket?.id ?? '';
  const subtitle = props.subtitle ?? props.threshold ?? '';
  const sentiment =
    props.sentiment ?? (pnlBucket ? pnlBucket.sentiment : accountBucket?.sentiment) ?? 'neutral';
  const walletCount = props.walletCount ?? props.wallet_count ?? bucket?.wallet_count ?? 0;
  const series = props.series ?? bucket?.series ?? [];
  const longNotional =
    props.longNotional ??
    props.long_notional ??
    pnlBucket?.long_notional ??
    accountBucket?.long_notional ??
    0;
  const shortNotional =
    props.shortNotional ??
    props.short_notional ??
    pnlBucket?.short_notional ??
    accountBucket?.short_notional ??
    0;
  const longRatio =
    props.longRatio ??
    props.long_ratio ??
    pnlBucket?.long_ratio ??
    accountBucket?.long_ratio ??
    (longNotional + shortNotional > 0 ? longNotional / (longNotional + shortNotional) : 0.5);

  const longText = formatUsd(longNotional) ?? '$0.00';
  const shortText = formatUsd(shortNotional) ?? '$0.00';

  const kind = props.kind ?? 'pnl';
  const bucketId = bucket?.id ?? '';
  const href = bucketId ? '/traders/overview/' + kind + '/' + bucketId : '#';

  return (
    <Link
      href={href}
      className="block cursor-pointer"
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.currentTarget as HTMLAnchorElement).click();
      }}
    >
      <div className="bg-card hover:bg-muted/40 rounded-xl border p-4 shadow-sm transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon className="text-primary h-5 w-5 shrink-0" />
            <div>
              <h3 className="text-sm leading-tight font-semibold">{title}</h3>
              {subtitle ? <p className="text-muted-foreground text-xs">{subtitle}</p> : null}
            </div>
          </div>
          <span
            className={
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ' +
              sentimentColor(String(sentiment))
            }
            data-testid="sentiment-badge"
          >
            {t(('sentiment.' + sentiment) as never)}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('walletsCount', { count: walletCount })}</span>
          {props.seriesLoading ? (
            <Skeleton className="h-6 w-24" data-testid="overview-sparkline-skeleton" />
          ) : (
            <OverviewSparkline series={series} width={96} height={24} />
          )}
        </div>

        <div className="text-muted-foreground mt-3 text-xs" title={t('approxTooltip')}>
          {t('long')} {t('approx')} {longText} / {t('short')} {t('approx')} {shortText}
        </div>

        <div className="bg-muted mt-2 h-2 w-full overflow-hidden rounded-full">
          <div
            className="h-full bg-emerald-500"
            style={{ width: Math.max(0, Math.min(100, longRatio * 100)) + '%' }}
            data-testid="split-bar"
          />
        </div>
      </div>
    </Link>
  );
}

export const TraderOverviewCard = OverviewCard;
export const OverviewBucketCard = OverviewCard;
