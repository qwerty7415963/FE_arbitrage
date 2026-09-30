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
import { createGroup, updateGroup } from '@/services/groups';
import { useAuthStore } from '@/lib/stores/auth';
import { GROUP_DUPLICATE_CODE, type Group } from '@/types/wallet-group';
import { Loader2Icon } from 'lucide-react';

interface GroupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: Group | null;
  onSuccess: (group: Group) => void;
}

export function GroupForm({ open, onOpenChange, group, onSuccess }: GroupFormProps) {
  const t = useTranslations('groups');
  const [name, setName] = useState(group?.name ?? '');
  const [description, setDescription] = useState(group?.description ?? '');
  const [color, setColor] = useState(group?.color ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = Boolean(group);

  function reset() {
    setName(group?.name ?? '');
    setDescription(group?.description ?? '');
    setColor(group?.color ?? '');
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

    setIsSubmitting(true);
    try {
      const payload = {
        name: trimmedName,
        description: description.trim() ? description.trim() : undefined,
        color: color.trim() ? color.trim() : undefined,
      };
      const saved = isEdit ? await updateGroup(group!.id, payload) : await createGroup(payload);
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

          <div className="space-y-2">
            <Label htmlFor="group-color">{t('color')}</Label>
            <Input
              id="group-color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder={t('colorPlaceholder')}
              maxLength={32}
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
