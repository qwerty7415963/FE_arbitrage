'use client';

import { useSyncExternalStore, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getSavedScansSnapshot,
  getServerSavedScansSnapshot,
  removeSavedScan,
  saveSavedScan,
  sanitizeScanQuery,
  subscribeSavedScans,
} from '@/lib/saved-scans';
import type { GroupWalletQuery } from '@/types/wallet-scan';
import { BookmarkIcon, XIcon } from 'lucide-react';

export interface SavedScansProps {
  query: GroupWalletQuery;
  onApply: (query: GroupWalletQuery) => void;
  disabled?: boolean;
}

export function SavedScans({ query, onApply, disabled }: SavedScansProps) {
  const t = useTranslations('wallets');
  const tc = useTranslations('common');
  const scans = useSyncExternalStore(
    subscribeSavedScans,
    getSavedScansSnapshot,
    getServerSavedScansSnapshot,
  );
  const [isNaming, setIsNaming] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  function startNaming() {
    setName('');
    setNameError(null);
    setIsNaming(true);
  }

  function cancelNaming() {
    setName('');
    setNameError(null);
    setIsNaming(false);
  }

  function handleSave() {
    const entry = saveSavedScan(name, query);
    if (!entry) {
      setNameError(t('saveSearchNameRequired'));
      return;
    }
    cancelNaming();
  }

  function handleRemove(id: string) {
    removeSavedScan(id);
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-lg border p-3"
      data-testid="saved-searches"
    >
      <span className="text-muted-foreground text-xs">{t('savedSearches')}</span>

      {scans.map((scan) => (
        <span
          key={scan.id}
          className="bg-muted/40 inline-flex items-center gap-1 rounded-full border py-1 pr-1 pl-3 text-sm"
        >
          <button
            type="button"
            className="max-w-40 truncate hover:underline"
            disabled={disabled}
            title={scan.name}
            onClick={() => onApply(sanitizeScanQuery(scan.query))}
          >
            {scan.name}
          </button>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground rounded-full p-0.5"
            disabled={disabled}
            aria-label={t('deleteSavedSearch', { name: scan.name })}
            onClick={() => handleRemove(scan.id)}
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </span>
      ))}

      {isNaming ? (
        <span className="flex items-center gap-1">
          <Input
            autoFocus
            value={name}
            aria-label={t('saveSearchPlaceholder')}
            placeholder={t('saveSearchPlaceholder')}
            className="h-8 w-40"
            disabled={disabled}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
              } else if (e.key === 'Escape') {
                cancelNaming();
              }
            }}
          />
          <Button size="sm" onClick={handleSave} disabled={disabled}>
            {tc('save')}
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelNaming} disabled={disabled}>
            {tc('cancel')}
          </Button>
          {nameError && <span className="text-destructive text-xs">{nameError}</span>}
        </span>
      ) : (
        <Button size="sm" variant="outline" onClick={startNaming} disabled={disabled}>
          <BookmarkIcon className="mr-1 h-4 w-4" />
          {t('saveSearch')}
        </Button>
      )}

      <span className="text-muted-foreground ml-auto text-xs">{t('savedSearchesLocalNote')}</span>
    </div>
  );
}
