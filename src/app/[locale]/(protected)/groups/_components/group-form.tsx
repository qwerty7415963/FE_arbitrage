'use client';

import { useState } from 'react';
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
import { createTraderGroup, updateTraderGroup } from '@/services/traders';
import { useAuthStore } from '@/lib/stores/auth';
import { GROUP_NAME_MAX_RUNES, type TraderGroup } from '@/types/trader';
import { Loader2Icon } from 'lucide-react';

interface GroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: TraderGroup | null;
  onSuccess: (group: TraderGroup) => void;
}

const GROUP_DUPLICATE_CODE = 'GROUP-002';

export function GroupForm({ open, onOpenChange, group, onSuccess }: GroupFormProps) {
  const t = useTranslations('groups');
  const [name, setName] = useState(group?.name ?? '');
  const [description, setDescription] = useState(group?.description ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = Boolean(group);

  function reset() {
    setName(group?.name ?? '');
    setDescription(group?.description ?? '');
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!useAuthStore.getState().requireAuth()) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t('nameRequired'));
      return;
    }
    if ([...trimmedName].length > GROUP_NAME_MAX_RUNES) {
      setError(t('nameTooLong'));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: trimmedName,
        description: description.trim() ? description.trim() : undefined,
      };
      const saved = isEdit
        ? await updateTraderGroup(group!.id, payload)
        : await createTraderGroup(payload);
      onSuccess(saved);
      onOpenChange(false);
      reset();
    } catch (err) {
      if (err instanceof ApiError && err.code === GROUP_DUPLICATE_CODE) {
        setError(t('duplicateName'));
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('unknownError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t('editTitle') : t('createTitle')}</DialogTitle>
          <DialogDescription>{t('formSubtitle')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="group-name">{t('name')}</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-description">{t('description')}</Label>
            <Input
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descriptionPlaceholder')}
            />
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
