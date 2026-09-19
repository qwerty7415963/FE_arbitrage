'use client';

import { ConnectWalletButton } from '@/components/shared/auth/connect-wallet-button';

export function SidebarFooter() {
  return (
    <div className="border-t p-4 lg:hidden">
      <ConnectWalletButton />
    </div>
  );
}
