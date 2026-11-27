'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ConnectWalletButton } from '@/components/shared/auth/connect-wallet-button';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { ThemeToggle } from '@/components/shared/theme/theme-toggle';

export function Header() {
  const t = useTranslations('common');

  return (
    <header className="bg-background flex h-14 items-center border-b px-3 lg:h-16 lg:px-6">
      <Link href="/" className="flex shrink-0 items-center gap-2">
        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-md">
          <span className="text-sm font-bold">A</span>
        </div>
        <span className="text-base font-semibold lg:text-lg">{t('appName')}</span>
      </Link>

      <div className="ml-auto flex items-center gap-1 lg:gap-2">
        <div className="preserve-control-size language-switcher lg:hidden">
          <LanguageSwitcher />
        </div>
        <ThemeToggle />
        <ConnectWalletButton />
        <div className="preserve-control-size hidden items-center gap-2 lg:flex">
          <div className="language-switcher">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
