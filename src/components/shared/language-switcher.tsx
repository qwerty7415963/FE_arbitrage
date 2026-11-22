'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { LanguagesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/lib/stores/auth';
import { apiClient } from '@/infrastructure/api-client';

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const switchLocale = (newLocale: string) => {
    const query = searchParams?.toString();
    const href = query ? `${pathname}?${query}` : pathname;
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.replace(href, { locale: newLocale });
    if (isAuthenticated) {
      void apiClient('/v1/telegram/settings', {
        method: 'PATCH',
        body: JSON.stringify({ locale: newLocale }),
      }).catch(() => {});
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" aria-label={t('language')} />}>
        <LanguagesIcon className="h-4 w-4" />
        {locale.toUpperCase()}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => switchLocale('vi')}>Tiếng Việt</DropdownMenuItem>
        <DropdownMenuItem onClick={() => switchLocale('en')}>English</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
