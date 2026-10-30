'use client';

import { useAppStore } from '@/lib/stores/app';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { ConnectWalletModal } from '@/components/shared/auth/connect-wallet-modal';
import { useSessionExpired } from '@/components/shared/providers';
import { useTranslations } from 'next-intl';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const { sessionExpired, dismissSessionExpired } = useSessionExpired();
  const t = useTranslations('common');

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">{t('menu')}</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        {sessionExpired && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200 lg:px-6"
          >
            <span>{t('sessionExpired')}</span>
            <Button variant="ghost" size="sm" onClick={dismissSessionExpired}>
              {t('dismiss')}
            </Button>
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>

      <ConnectWalletModal />
    </div>
  );
}
