'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { UnfollowTarget } from '@/hooks/use-unfollow-confirm';

export interface UnfollowConfirmDialogProps {
  target: UnfollowTarget | null;
  skipChecked: boolean;
  onSkipChange: (value: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function UnfollowConfirmDialog({
  target,
  skipChecked,
  onSkipChange,
  onConfirm,
  onCancel,
}: UnfollowConfirmDialogProps) {
  const t = useTranslations('groups');
  return (
    <Dialog
      open={!!target}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {t('unfollowConfirmTitle', { default: 'Remove from Following?' })}
          </DialogTitle>
          <DialogDescription>
            {target
              ? `${target.label} (${target.wallet.slice(0, 6)}...${target.wallet.slice(-4)})`
              : ''}
            <br />
            {t('unfollowConfirmBody', {
              default: 'This wallet stays in its groups. Only your Following list changes.',
            })}
          </DialogDescription>
        </DialogHeader>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={skipChecked} onChange={(e) => onSkipChange(e.target.checked)} />
          <span>{t('unfollowSkipConfirm', { default: "Don't ask again" })}</span>
        </label>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('cancel')}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            {t('remove', { default: 'Remove' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
