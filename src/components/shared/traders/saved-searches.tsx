'use client';

import { useSyncExternalStore, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getSavedSearchesSnapshot,
  getServerSavedSearchesSnapshot,
  removeSavedSearch,
  saveSavedSearch,
  sanitizeTraderSearchQuery,
  subscribeSavedSearches,
} from '@/lib/trader-saved-searches';
import type { TraderSearchQuery } from '@/types/trader';
import { BookmarkIcon, XIcon } from 'lucide-react';

export interface SavedSearchesProps {
  query: TraderSearchQuery;
  onApply: (query: TraderSearchQuery) => void;
  disabled?: boolean;
}

export function SavedSearches({ query, onApply, disabled }: SavedSearchesProps) {
  const t = useTranslations('traders');
  const tc = useTranslations('common');
  const searches = useSyncExternalStore(
    subscribeSavedSearches,
    getSavedSearchesSnapshot,
    getServerSavedSearchesSnapshot,
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
    const entry = saveSavedSearch(name, query);
    if (!entry) {
      setNameError(t('saveSearchNameRequired'));
      return;
    }
    cancelNaming();
  }

  function handleRemove(id: string) {
    removeSavedSearch(id);
  }

  return (
    <fieldset className="flex flex-col gap-2 rounded-lg border p-3" data-testid="saved-searches">
      <legend className="text-sm font-medium">{t('savedSearchesCluster')}</legend>

      <div className="flex flex-wrap items-center gap-2">
        {searches.map((search) => (
          <span
            key={search.id}
            className="bg-muted/40 inline-flex items-center gap-1 rounded-full border py-1 pr-1 pl-3 text-sm"
          >
            <button
              type="button"
              className="max-w-40 truncate hover:underline"
              disabled={disabled}
              title={search.name}
              onClick={() => onApply(sanitizeTraderSearchQuery(search.query))}
            >
              {search.name}
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground rounded-full p-0.5"
              disabled={disabled}
              aria-label={t('deleteSavedSearch', { name: search.name })}
              onClick={() => handleRemove(search.id)}
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
            <Button type="button" size="sm" onClick={handleSave} disabled={disabled}>
              {tc('save')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={cancelNaming}
              disabled={disabled}
            >
              {tc('cancel')}
            </Button>
            {nameError && <span className="text-destructive text-xs">{nameError}</span>}
          </span>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={startNaming}
            disabled={disabled}
          >
            <BookmarkIcon className="mr-1 h-4 w-4" />
            {t('saveSearch')}
          </Button>
        )}
      </div>

      <span className="text-muted-foreground text-xs">{t('savedSearchesLocalNote')}</span>
    </fieldset>
  );
}
