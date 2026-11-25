'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/infrastructure/api-client';
import { mapErrorCode } from '@/lib/error-mapping';
import {
  deleteGroupAlert,
  getGroupAlertEvents,
  getGroupAlerts,
  markAllGroupAlertEventsRead,
  markGroupAlertEventRead,
  updateGroupAlert,
} from '@/services/traders';
import type { GroupAlert, GroupAlertEvent } from '@/types/trader';
import { GroupAlertFormDialog } from './group-alert-form-dialog';

export interface GroupAlertsPanelProps {
  groupId: string;
}

export function GroupAlertsPanel({ groupId }: GroupAlertsPanelProps) {
  const t = useTranslations('groups');
  const te = useTranslations();

  const [alerts, setAlerts] = useState<GroupAlert[]>([]);
  const [unreadEvents, setUnreadEvents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GroupAlert | null>(null);

  const [events, setEvents] = useState<GroupAlertEvent[]>([]);
  const [eventsCursor, setEventsCursor] = useState<string | null>(null);
  const [eventsHasMore, setEventsHasMore] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getGroupAlerts(groupId);
      setAlerts(res);
      setUnreadEvents(res.reduce((sum, a) => sum + (a.unread_events ?? 0), 0));
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  const loadEvents = useCallback(
    async (reset = false, unread = unreadOnly) => {
      setEventsLoading(true);
      setError(null);
      try {
        const page = await getGroupAlertEvents(groupId, {
          unread: unread || undefined,
          limit: 20,
          cursor: reset ? undefined : (eventsCursor ?? undefined),
        });
        if (reset) setEvents(page.items);
        else setEvents((prev) => [...prev, ...page.items]);
        setEventsCursor(page.next_cursor);
        setEventsHasMore(page.has_more);
      } catch (err) {
        setError(err);
      } finally {
        setEventsLoading(false);
      }
    },
    [groupId, eventsCursor, unreadOnly],
  );

  useEffect(() => {
    async function run() {
      await loadAlerts();
    }
    void run();
  }, [loadAlerts]);

  useEffect(() => {
    async function run() {
      setEventsCursor(null);
      await loadEvents(true, unreadOnly);
    }
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadOnly]);

  const errorMessage =
    error instanceof ApiError
      ? te(mapErrorCode(error.code), { defaultValue: te('errors.unknown') })
      : error instanceof Error
        ? error.message
        : t('unknownError');

  function handleCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function handleEdit(alert: GroupAlert) {
    setEditing(alert);
    setDialogOpen(true);
  }

  async function handleDelete(alert: GroupAlert) {
    if (!window.confirm(t('deleteAlertConfirm'))) return;
    try {
      await deleteGroupAlert(alert.id);
      setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    } catch (err) {
      setError(err);
    }
  }

  async function handleToggleEnabled(alert: GroupAlert) {
    try {
      const updated = await updateGroupAlert(alert.id, { enabled: !alert.enabled });
      setAlerts((prev) => prev.map((a) => (a.id === alert.id ? updated : a)));
    } catch (err) {
      setError(err);
    }
  }

  async function handleMarkRead(ev: GroupAlertEvent) {
    try {
      await markGroupAlertEventRead(ev.id);
      setEvents((prev) =>
        prev.map((e) => (e.id === ev.id ? { ...e, read_at: new Date().toISOString() } : e)),
      );
      setUnreadEvents((c) => Math.max(0, c - (ev.read_at ? 0 : 1)));
    } catch (err) {
      setError(err);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllGroupAlertEventsRead(groupId);
      setEvents((prev) =>
        prev.map((e) => ({ ...e, read_at: e.read_at ?? new Date().toISOString() })),
      );
      setUnreadEvents(0);
    } catch (err) {
      setError(err);
    }
  }

  function handleDialogSuccess(saved: GroupAlert) {
    setAlerts((prev) => {
      const idx = prev.findIndex((a) => a.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {t('alerts')} {unreadEvents > 0 ? `(${unreadEvents})` : ''}
        </h2>
        <Button size="sm" onClick={handleCreate}>
          {t('createAlert')}
        </Button>
      </div>

      {error ? (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {errorMessage}{' '}
          <Button variant="link" size="sm" onClick={loadAlerts}>
            {t('retry')}
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex flex-col gap-2" role="status" aria-label={t('loading')}>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-muted-foreground py-8 text-center text-sm">{t('noAlerts')}</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">{t('alertName')}</th>
                <th className="p-2">{t('alertType')}</th>
                <th className="p-2">{t('enabled')}</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="p-2 font-medium">{a.name}</td>
                  <td className="p-2">{t(`alertType_${a.type}` as never)}</td>
                  <td className="p-2">
                    <Button variant="ghost" size="sm" onClick={() => handleToggleEnabled(a)}>
                      {a.enabled ? t('alertEnabled') : t('alertDisabled')}
                    </Button>
                  </td>
                  <td className="p-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => handleEdit(a)}>
                        {t('editAlert')}
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(a)}>
                        {t('deleteAlert')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">{t('alertHistory')}</h3>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
              />
              <span>{t('unreadOnly')}</span>
            </label>
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              {t('markAllRead')}
            </Button>
          </div>
        </div>

        {eventsLoading && events.length === 0 ? (
          <div className="flex flex-col gap-2" role="status" aria-label={t('loading')}>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-muted-foreground py-6 text-center text-sm">{t('noAlertEvents')}</div>
        ) : (
          <>
            <ul className="flex flex-col gap-1">
              {events.map((ev) => (
                <li
                  key={ev.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border px-2 py-1 text-sm"
                >
                  <span className="bg-muted rounded px-1.5 py-0.5 text-xs font-medium">
                    {ev.type}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(ev.triggered_at).toLocaleString()}
                  </span>
                  {ev.read_at ? (
                    <span className="text-muted-foreground text-xs">{t('markRead')}</span>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => handleMarkRead(ev)}>
                      {t('markRead')}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            {eventsHasMore ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadEvents(false)}
                disabled={eventsLoading}
              >
                {t('loadMore')}
              </Button>
            ) : null}
          </>
        )}
      </div>

      <GroupAlertFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        groupId={groupId}
        alert={editing}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}

export default GroupAlertsPanel;
