'use client';

import { useCallback, useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/infrastructure/api-client';
import { mapErrorCode } from '@/lib/error-mapping';
import { getGroupActivity } from '@/services/traders';
import type { GroupActivityEvent } from '@/types/trader';
import { shortAddress, formatSignedUsd, formatRelativeTime } from '@/lib/trader-format';

export interface GroupActivityTimelineProps {
  groupId: string;
}

export function GroupActivityTimeline({ groupId }: GroupActivityTimelineProps) {
  const t = useTranslations('groups');
  const te = useTranslations();
  const [items, setItems] = useState<GroupActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [partial, setPartial] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterWallet, setFilterWallet] = useState('');
  const [filterAsset, setFilterAsset] = useState('');

  const loadFirst = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const page = await getGroupActivity(groupId, {
        limit: 20,
        wallet: filterWallet.trim() || undefined,
        asset: filterAsset.trim() || undefined,
        type: filterType || undefined,
      });
      setItems(page.items);
      setCursor(page.next_cursor);
      setHasMore(page.has_more);
      setPartial(page.partial);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, filterWallet, filterAsset, filterType]);

  useEffect(() => {
    async function run() {
      await loadFirst();
    }
    void run();
  }, [loadFirst]);

  async function loadMore() {
    if (!cursor) return;
    setIsLoading(true);
    setError(null);
    try {
      const page = await getGroupActivity(groupId, {
        limit: 20,
        cursor,
        wallet: filterWallet.trim() || undefined,
        asset: filterAsset.trim() || undefined,
        type: filterType || undefined,
      });
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.next_cursor);
      setHasMore(page.has_more);
      setPartial(page.partial);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }

  const errorMessage =
    error instanceof ApiError
      ? te(mapErrorCode(error.code), { defaultValue: te('errors.unknown') })
      : error instanceof Error
        ? error.message
        : t('unknownError');

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t('activity')}</h2>
      <div className="flex flex-wrap items-end gap-2">
        <Input
          value={filterWallet}
          onChange={(e) => setFilterWallet(e.target.value)}
          placeholder={t('filterByWallet')}
          className="h-8 w-48"
        />
        <Input
          value={filterAsset}
          onChange={(e) => setFilterAsset(e.target.value)}
          placeholder={t('filterByAsset')}
          className="h-8 w-40"
        />
        <select
          aria-label={t('filterByType')}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-background h-8 rounded-md border px-2 text-sm"
        >
          <option value="">{t('eventType')}</option>
          <option value="position_opened">position_opened</option>
          <option value="position_increased">position_increased</option>
          <option value="position_reduced">position_reduced</option>
          <option value="position_closed">position_closed</option>
          <option value="added">added</option>
          <option value="removed">removed</option>
        </select>
      </div>

      {error ? (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {errorMessage}{' '}
          <Button variant="link" size="sm" onClick={loadFirst}>
            {t('retry')}
          </Button>
        </div>
      ) : null}

      {isLoading && items.length === 0 ? (
        <div className="flex flex-col gap-2" role="status" aria-label={t('loading')}>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-muted-foreground py-8 text-center text-sm">{t('noMembers')}</div>
      ) : (
        <>
          <ul className="flex flex-col gap-1">
            {items.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center gap-2 rounded-md border px-2 py-1 text-sm"
              >
                <span
                  aria-label={t('eventType')}
                  className="bg-muted rounded px-1.5 py-0.5 text-xs font-medium"
                >
                  {e.type}
                </span>
                <Link href={`/traders/${e.wallet_address}`} className="font-medium hover:underline">
                  {shortAddress(e.wallet_address)}
                </Link>
                {e.coin ? <span>{e.coin}</span> : null}
                <span className="tabular-nums">{e.size_delta ?? '—'}</span>
                <span className="tabular-nums">{formatSignedUsd(e.realized_pnl)}</span>
                <span aria-label={t('eventTime')} className="text-muted-foreground text-xs">
                  {formatRelativeTime(e.occurred_at) ?? e.occurred_at}
                </span>
              </li>
            ))}
          </ul>
          {partial ? (
            <span className="text-muted-foreground text-xs">{t('partialData')}</span>
          ) : null}
          {hasMore ? (
            <Button variant="outline" size="sm" onClick={loadMore} disabled={isLoading}>
              {t('loadMore')}
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}

export default GroupActivityTimeline;
