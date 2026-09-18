'use client';

import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/stores/app';
import { MenuIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function Header() {
  const { toggleSidebar } = useAppStore();
  const t = useTranslations('common');

  return (
    <header className="bg-background flex h-16 items-center border-b px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggleSidebar}
        aria-label={t('menu')}
      >
        <MenuIcon className="h-5 w-5" />
      </Button>

      <div className="flex flex-1 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 lg:hidden">
          <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-md">
            <span className="text-sm font-bold">A</span>
          </div>
          <span className="text-lg font-semibold">{t('appName')}</span>
        </Link>
      </div>
    </header>
  );
}
