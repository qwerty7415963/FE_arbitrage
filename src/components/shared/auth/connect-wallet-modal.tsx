'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConnectWalletButton } from '@/components/shared/auth/connect-wallet-button';
import { useAuthStore } from '@/lib/stores/auth';

export function ConnectWalletModal() {
  const t = useTranslations('wallet');
  const { connectModalOpen, setConnectModalOpen, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && connectModalOpen) {
      setConnectModalOpen(false);
    }
  }, [isAuthenticated, connectModalOpen, setConnectModalOpen]);

  return (
    <Dialog open={connectModalOpen} onOpenChange={setConnectModalOpen}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{t('connectRequiredTitle')}</DialogTitle>
          <DialogDescription>{t('connectRequiredSubtitle')}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-2">
          <ConnectWalletButton />
        </div>
      </DialogContent>
    </Dialog>
  );
}
