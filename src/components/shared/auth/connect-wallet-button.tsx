'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore, formatAddress } from '@/lib/stores/auth';
import { useTranslations } from 'next-intl';
import { WalletIcon, LogOutIcon, Loader2Icon } from 'lucide-react';

export function ConnectWalletButton() {
  const { address, isConnecting, connectWallet, disconnectWallet } = useAuthStore();
  const t = useTranslations('wallet');

  if (isConnecting) {
    return (
      <Button variant="outline" disabled>
        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
        {t('connecting')}
      </Button>
    );
  }

  if (address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger render={<div />} nativeButton={false}>
          <Button variant="outline" className="gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            {formatAddress(address)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem variant="destructive" onClick={disconnectWallet}>
            <LogOutIcon className="mr-2 h-4 w-4" />
            {t('disconnect')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button variant="outline" onClick={connectWallet}>
      <WalletIcon className="mr-2 h-4 w-4" />
      {t('connect')}
    </Button>
  );
}
