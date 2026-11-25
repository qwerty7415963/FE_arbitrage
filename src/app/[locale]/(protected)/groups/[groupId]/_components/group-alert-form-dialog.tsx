'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/infrastructure/api-client';
import { mapErrorCode } from '@/lib/error-mapping';
import { createGroupAlert, updateGroupAlert } from '@/services/traders';
import { useAuthStore } from '@/lib/stores/auth';
import type { GroupAlert } from '@/types/trader';
import { Loader2Icon } from 'lucide-react';

interface GroupAlertFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  alert: GroupAlert | null;
  onSuccess: (alert: GroupAlert) => void;
}

const ALERT_TYPES = [
  'unrealized_pnl_above',
  'unrealized_pnl_below',
  'realized_pnl_reaches',
  'roi_reaches',
  'position_opened',
  'position_closed',
  'position_increased',
  'position_reduced',
  'exposure_above',
  'long_short_shift',
  'wallet_inactive',
  'wallet_stale',
  'wallet_added',
  'wallet_removed',
] as const;

function defaultParamsForType(type: string): Record<string, unknown> {
  switch (type) {
    case 'unrealized_pnl_above':
    case 'unrealized_pnl_below':
      return { threshold_usd: 0 };
    case 'realized_pnl_reaches':
    case 'roi_reaches':
      return { threshold: 0, direction: 'above' };
    case 'exposure_above':
      return { metric: 'gross', threshold_usd: 0 };
    case 'long_short_shift':
      return { window: '7D', threshold_pct: 0 };
    case 'wallet_inactive':
      return { days: 7 };
    case 'wallet_stale':
      return { minutes: 60 };
    default:
      return {};
  }
}

function num(v: unknown): string {
  return v == null ? '' : String(v);
}

export function GroupAlertFormDialog({
  open,
  onOpenChange,
  groupId,
  alert,
  onSuccess,
}: GroupAlertFormDialogProps) {
  const t = useTranslations('groups');
  const te = useTranslations();
  const isEdit = Boolean(alert);

  const [name, setName] = useState(alert?.name ?? '');
  const [type, setType] = useState<string>(alert?.type ?? 'unrealized_pnl_above');
  const [params, setParams] = useState<Record<string, unknown>>(alert?.params ?? {});
  const [enabled, setEnabled] = useState(alert?.enabled ?? true);
  const [cooldown, setCooldown] = useState<number>(alert?.cooldown_seconds ?? 300);
  const [notifyInApp, setNotifyInApp] = useState(alert?.notify_in_app ?? true);
  const [notifyTelegram, setNotifyTelegram] = useState(alert?.notify_telegram ?? false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    async function run() {
      setName(alert?.name ?? '');
      setType(alert?.type ?? 'unrealized_pnl_above');
      setParams(alert?.params ?? defaultParamsForType(alert?.type ?? 'unrealized_pnl_above'));
      setEnabled(alert?.enabled ?? true);
      setCooldown(alert?.cooldown_seconds ?? 300);
      setNotifyInApp(alert?.notify_in_app ?? true);
      setNotifyTelegram(alert?.notify_telegram ?? false);
      setError(null);
    }
    void run();
  }, [open, alert]);

  function setParam(key: string, value: unknown) {
    setParams((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!useAuthStore.getState().requireAuth()) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('nameRequired'));
      return;
    }
    const finalParams = { ...defaultParamsForType(type), ...params };
    // numeric validation
    const numericKeys = ['threshold_usd', 'threshold', 'threshold_pct', 'days', 'minutes'];
    for (const k of numericKeys) {
      if (finalParams[k] !== undefined && finalParams[k] !== null && finalParams[k] !== '') {
        const n = Number(finalParams[k]);
        if (!Number.isFinite(n)) {
          setError(te('errors.INVALID_ALERT_PARAMS'));
          return;
        }
        finalParams[k] = n;
      }
    }
    // required threshold validation
    if (
      ['unrealized_pnl_above', 'unrealized_pnl_below', 'exposure_above'].includes(type) &&
      !Number.isFinite(Number(finalParams.threshold_usd))
    ) {
      setError(te('errors.INVALID_ALERT_PARAMS'));
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name: trimmed,
        type,
        params: finalParams,
        enabled,
        cooldown_seconds: cooldown,
        notify_in_app: notifyInApp,
        notify_telegram: notifyTelegram,
      };
      const saved = isEdit
        ? await updateGroupAlert(alert!.id, payload)
        : await createGroupAlert(groupId, payload);
      onSuccess(saved);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(te(mapErrorCode(err.code), { defaultValue: te('errors.unknown') }));
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('unknownError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const thresholdTypes = new Set([
    'unrealized_pnl_above',
    'unrealized_pnl_below',
    'exposure_above',
  ]);
  const reachesTypes = new Set(['realized_pnl_reaches', 'roi_reaches']);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setError(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t('editAlert') : t('createAlert')}</DialogTitle>
          <DialogDescription>{t('formSubtitle')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="alert-name">{t('alertName')}</Label>
            <Input
              id="alert-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('alertName')}
              maxLength={100}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alert-type">{t('alertType')}</Label>
            <select
              id="alert-type"
              aria-label={t('alertType')}
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setParams(defaultParamsForType(e.target.value));
              }}
              className="bg-background h-9 w-full rounded-md border px-2 text-sm"
              disabled={isSubmitting || isEdit}
            >
              {ALERT_TYPES.map((at) => (
                <option key={at} value={at}>
                  {t(`alertType_${at}` as never)}
                </option>
              ))}
            </select>
          </div>

          {thresholdTypes.has(type) && (
            <div className="space-y-2">
              <Label htmlFor="alert-threshold">
                {type === 'exposure_above' ? t('thresholdUsd') : t('thresholdUsd')}
              </Label>
              {type === 'exposure_above' && (
                <select
                  aria-label={t('metric')}
                  value={(params.metric as string) ?? 'gross'}
                  onChange={(e) => setParam('metric', e.target.value)}
                  className="bg-background h-9 w-full rounded-md border px-2 text-sm"
                >
                  <option value="gross">{t('metricGross')}</option>
                  <option value="net">{t('metricNet')}</option>
                  <option value="long">{t('metricLong')}</option>
                  <option value="short">{t('metricShort')}</option>
                </select>
              )}
              <Input
                id="alert-threshold"
                type="number"
                value={num(params.threshold_usd)}
                onChange={(e) => setParam('threshold_usd', Number(e.target.value))}
                placeholder={t('thresholdUsd')}
              />
            </div>
          )}

          {reachesTypes.has(type) && (
            <div className="space-y-2">
              <Label>{t('threshold')}</Label>
              <Input
                type="number"
                value={num(params.threshold)}
                onChange={(e) => setParam('threshold', Number(e.target.value))}
                placeholder={t('threshold')}
              />
              <select
                aria-label={t('direction')}
                value={(params.direction as string) ?? 'above'}
                onChange={(e) => setParam('direction', e.target.value)}
                className="bg-background h-9 w-full rounded-md border px-2 text-sm"
              >
                <option value="above">{t('directionAbove')}</option>
                <option value="below">{t('directionBelow')}</option>
              </select>
            </div>
          )}

          {(type === 'position_opened' ||
            type === 'position_closed' ||
            type === 'position_increased' ||
            type === 'position_reduced') && (
            <div className="space-y-2">
              <Label htmlFor="alert-coin">{t('coinOptional')}</Label>
              <Input
                id="alert-coin"
                value={(params.coin as string) ?? ''}
                onChange={(e) => setParam('coin', e.target.value || undefined)}
                placeholder="BTC"
              />
            </div>
          )}

          {type === 'long_short_shift' && (
            <div className="space-y-2">
              <Label>{t('window')}</Label>
              <select
                aria-label={t('window')}
                value={(params.window as string) ?? '7D'}
                onChange={(e) => setParam('window', e.target.value)}
                className="bg-background h-9 w-full rounded-md border px-2 text-sm"
              >
                <option value="1D">1D</option>
                <option value="7D">7D</option>
                <option value="30D">30D</option>
              </select>
              <Label>{t('threshold')}</Label>
              <Input
                type="number"
                value={num(params.threshold_pct)}
                onChange={(e) => setParam('threshold_pct', Number(e.target.value))}
                placeholder={t('threshold')}
              />
            </div>
          )}

          {type === 'wallet_inactive' && (
            <div className="space-y-2">
              <Label>{t('days')}</Label>
              <Input
                type="number"
                value={num(params.days)}
                onChange={(e) => setParam('days', Number(e.target.value))}
                placeholder={t('days')}
              />
            </div>
          )}

          {type === 'wallet_stale' && (
            <div className="space-y-2">
              <Label>{t('minutes')}</Label>
              <Input
                type="number"
                value={num(params.minutes)}
                onChange={(e) => setParam('minutes', Number(e.target.value))}
                placeholder={t('minutes')}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="alert-cooldown">{t('cooldown')}</Label>
            <Input
              id="alert-cooldown"
              type="number"
              value={cooldown}
              onChange={(e) => setCooldown(Number(e.target.value))}
              min={0}
              max={86400}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <span>{t('enabled')}</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={notifyInApp}
                onChange={(e) => setNotifyInApp(e.target.checked)}
              />
              <span>{t('notifyInApp')}</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={notifyTelegram}
                onChange={(e) => setNotifyTelegram(e.target.checked)}
              />
              <span>{t('notifyTelegram')}</span>
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEdit ? t('save') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
