'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTelegramStatus, useTelegramLink, useTelegramUnlink } from '@/hooks/use-telegram';
import { useAuthGate } from '@/hooks/use-auth-gate';
import { useAuthStore } from '@/lib/stores/auth';
import { ConnectWalletButton } from '@/components/shared/auth/connect-wallet-button';
import type { TelegramLinkResponse } from '@/services/telegram';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tn = useTranslations('notifications');
  const tc = useTranslations('common');
  const locale = useLocale();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setConnectModalOpen = useAuthStore((s) => s.setConnectModalOpen);
  const statusQuery = useTelegramStatus({ enabled: isAuthenticated });
  const gate = useAuthGate({
    isAuthenticated,
    isLoading: statusQuery.isLoading,
    error: statusQuery.error,
  });
  const linkMutation = useTelegramLink();
  const unlinkMutation = useTelegramUnlink();

  const [modalOpen, setModalOpen] = useState(false);
  const [linkData, setLinkData] = useState<TelegramLinkResponse | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const status = statusQuery.data;

  const handleConnect = useCallback(async () => {
    setConnectError(null);
    try {
      const data = await linkMutation.mutateAsync(locale);
      setLinkData(data);
      setModalOpen(true);
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : tn('error'));
    }
  }, [linkMutation, locale, tn]);

  const handleRelink = useCallback(async () => {
    setConnectError(null);
    try {
      await unlinkMutation.mutateAsync();
      const data = await linkMutation.mutateAsync(locale);
      setLinkData(data);
      setModalOpen(true);
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : tn('error'));
    }
  }, [unlinkMutation, linkMutation, locale, tn]);

  useEffect(() => {
    if (!modalOpen) return;
    const started = Date.now();
    const TEN_MINUTES = 10 * 60 * 1000;
    const interval = setInterval(async () => {
      if (Date.now() - started >= TEN_MINUTES) {
        clearInterval(interval);
        return;
      }
      const res = await statusQuery.refetch();
      if (res.data?.connected) {
        setModalOpen(false);
        setLinkData(null);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [modalOpen, statusQuery]);

  async function handleCopy() {
    if (!linkData) return;
    try {
      await navigator.clipboard?.writeText(linkData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  async function handleDisconnect() {
    setConfirmDisconnect(false);
    try {
      await unlinkMutation.mutateAsync();
    } catch {
      // status query will reflect; ignore
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold">{tn('title')}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{tn('description')}</p>

        {gate === 'loading' ? (
          <div className="mt-4 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-32" />
          </div>
        ) : gate === 'unauthenticated' ? (
          <div className="mt-4 space-y-3">
            <div className="text-muted-foreground text-sm">
              {tn('connectToManageNotifications')}
            </div>
            <ConnectWalletButton />
          </div>
        ) : gate === 'expired' ? (
          <div className="mt-4 space-y-3">
            <div className="text-muted-foreground text-sm">{tn('sessionExpired')}</div>
            <Button variant="outline" onClick={() => setConnectModalOpen(true)}>
              {tn('reconnect')}
            </Button>
          </div>
        ) : gate === 'error' ? (
          <div className="bg-destructive/10 text-destructive mt-4 rounded-md p-3 text-sm">
            {tn('error')}{' '}
            <Button variant="link" size="sm" onClick={() => statusQuery.refetch()}>
              {tn('retry')}
            </Button>
          </div>
        ) : status?.connected ? (
          <div className="mt-4 space-y-2">
            <div className="text-sm">
              {tn('connectedAs', { username: status.tg_username ?? '' })}
            </div>
            <div className="text-sm">
              {tn('locale')}: {status.locale}
            </div>
            <div className="text-sm">{tn('groupsEnabled', { count: status.groups_enabled })}</div>
            <div className="mt-2 flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDisconnect(true)}
                disabled={unlinkMutation.isPending || linkMutation.isPending}
              >
                {tn('disconnect')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRelink}
                disabled={unlinkMutation.isPending || linkMutation.isPending}
              >
                {tn('relink')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {connectError && (
              <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                {connectError}
              </div>
            )}
            <Button onClick={handleConnect} disabled={linkMutation.isPending}>
              {tn('connect')}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tn('title')}</DialogTitle>
            <DialogDescription>{tn('deepLink')}</DialogDescription>
          </DialogHeader>
          {linkData && (
            <div className="space-y-3">
              <a
                href={linkData.deep_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button>{tn('deepLink')}</Button>
              </a>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{tn('code')}:</span>
                <code className="bg-muted rounded px-2 py-1 text-sm">{linkData.code}</code>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? tn('copied') : tn('copy')}
                </Button>
              </div>
              <div className="text-muted-foreground text-sm">
                {tn('expiresAt')}: {linkData.expires_at}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDisconnect} onOpenChange={setConfirmDisconnect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tn('disconnect')}</DialogTitle>
            <DialogDescription>{tn('disconnectConfirm')}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDisconnect(false)}>
              {tc('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDisconnect}>
              {tn('disconnect')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
