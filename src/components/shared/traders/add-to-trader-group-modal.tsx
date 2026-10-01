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
import { useAuthStore } from '@/lib/stores/auth';
import { isValidWalletAddress } from '@/lib/trader-validation';
import { addGroupMembers, createTraderGroup, listTraderGroups } from '@/services/traders';
import { GROUP_NAME_MAX_RUNES, type MemberInput, type TraderGroup } from '@/types/trader';
import { Loader2Icon, PlusIcon } from 'lucide-react';

const GROUP_DUPLICATE_CODE = 'GROUP-002';

interface AddToTraderGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: MemberInput[];
  defaultGroupId?: string;
  onSuccess?: () => void;
}

function parsePasted(raw: string): { valid: string[]; invalid: number } {
  const parts = raw
    .split(/[\s,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const valid: string[] = [];
  let invalid = 0;
  for (const p of parts) {
    if (isValidWalletAddress(p)) valid.push(p.toLowerCase());
    else invalid += 1;
  }
  return { valid, invalid };
}

export function AddToTraderGroupModal({
  open,
  onOpenChange,
  members,
  defaultGroupId,
  onSuccess,
}: AddToTraderGroupModalProps) {
  const t = useTranslations('groups');
  const [tab, setTab] = useState<'search' | 'paste'>('search');
  const [groups, setGroups] = useState<TraderGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(defaultGroupId);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [pasted, setPasted] = useState('');
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setError(null);
      setAdded(null);
      setTab(members.length > 0 ? 'search' : 'paste');
      setSelectedGroupId(defaultGroupId);
    }
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      setIsLoadingGroups(true);
      try {
        const data = await listTraderGroups();
        if (!cancelled) setGroups(data);
      } catch {
        if (!cancelled) setGroups([]);
      } finally {
        if (!cancelled) setIsLoadingGroups(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const { valid: pastedAddresses, invalid: pastedInvalid } = parsePasted(pasted);
  const submitMembers: MemberInput[] =
    tab === 'search'
      ? members
      : pastedAddresses.map((wallet_address) => ({ venue: 'hyperliquid', wallet_address }));

  async function handleCreateInline() {
    const name = newName.trim();
    if (!name) {
      setError(t('nameRequired'));
      return;
    }
    if ([...name].length > GROUP_NAME_MAX_RUNES) {
      setError(t('nameTooLong'));
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      const created = await createTraderGroup({ name });
      setGroups((prev) => [created, ...prev]);
      setSelectedGroupId(created.id);
      setNewName('');
    } catch (err) {
      if (err instanceof ApiError && err.code === GROUP_DUPLICATE_CODE) {
        setError(t('duplicateName'));
      } else {
        setError(err instanceof Error ? err.message : t('unknownError'));
      }
    } finally {
      setIsCreating(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    setAdded(null);
    if (!useAuthStore.getState().requireAuth()) return;
    if (!selectedGroupId) {
      setError(t('selectGroupRequired'));
      return;
    }
    if (submitMembers.length === 0) {
      setError(t('noWalletsToAdd'));
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await addGroupMembers(selectedGroupId, submitMembers);
      setAdded(res.added);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('unknownError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('addToGroupTitle')}</DialogTitle>
          <DialogDescription>{t('addToGroupSubtitle')}</DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 flex gap-1 rounded-lg p-1">
          <Button
            variant={tab === 'search' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setTab('search')}
          >
            {t('fromScan')} ({members.length})
          </Button>
          <Button
            variant={tab === 'paste' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setTab('paste')}
          >
            {t('pasteAddresses')}
          </Button>
        </div>

        {tab === 'paste' && (
          <div className="space-y-2">
            <Label htmlFor="paste-traders">{t('pasteLabel')}</Label>
            <textarea
              id="paste-traders"
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder={'0x1234...\n0x5678...'}
              rows={4}
              className="border-input bg-background w-full rounded-lg border px-2.5 py-1 text-sm outline-none"
            />
            <p className="text-muted-foreground text-xs">
              {t('pastePreview', { valid: pastedAddresses.length, invalid: pastedInvalid })}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label>{t('chooseGroup')}</Label>
          {isLoadingGroups ? (
            <p className="text-muted-foreground text-sm">{t('loading')}</p>
          ) : groups.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('empty')}</p>
          ) : (
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {groups.map((g) => (
                <label
                  key={g.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-sm"
                >
                  <input
                    type="radio"
                    name="target-group"
                    checked={selectedGroupId === g.id}
                    onChange={() => setSelectedGroupId(g.id)}
                    className="h-4 w-4"
                  />
                  <span className="font-medium">{g.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {g.member_count} {t('wallets')}
                  </span>
                </label>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('namePlaceholder')}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateInline}
              disabled={isCreating}
              aria-label={t('create')}
            >
              {isCreating ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <PlusIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">{error}</div>
        )}

        {added !== null && (
          <div className="bg-primary/10 text-primary rounded-md p-3 text-sm">
            {t('addMembersResult', { added })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || submitMembers.length === 0}>
            {isSubmitting ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('addCount', { count: submitMembers.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
