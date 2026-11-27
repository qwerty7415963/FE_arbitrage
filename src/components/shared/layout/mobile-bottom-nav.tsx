'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { locales } from '@/config/i18n';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  TrendingUpIcon,
  FolderIcon,
  RadarIcon,
  LayoutDashboardIcon,
  SettingsIcon,
} from 'lucide-react';

const NAV_ITEMS: ReadonlyArray<{
  href: string;
  icon: typeof LayoutDashboardIcon;
  labelKey: string;
  primary?: boolean;
}> = [
  { href: '/traders/overview', icon: LayoutDashboardIcon, labelKey: 'overview' },
  { href: '/groups', icon: FolderIcon, labelKey: 'groups' },
  { href: '/traders', icon: RadarIcon, labelKey: 'scanner', primary: true },
  { href: '/funding-arbitrage', icon: TrendingUpIcon, labelKey: 'fundingArbitrage' },
  { href: '/settings', icon: SettingsIcon, labelKey: 'settings' },
];

function isActivePath(normalizedPathname: string, href: string): boolean {
  if (normalizedPathname === href) return true;
  if (href === '/traders') {
    return (
      normalizedPathname.startsWith('/traders/') &&
      !normalizedPathname.startsWith('/traders/overview')
    );
  }
  return normalizedPathname.startsWith(href + '/');
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const t = useTranslations('navigation');
  const localePrefix = new RegExp(`^/(${locales.join('|')})(?=/|$)`);
  const normalizedPathname = pathname.replace(localePrefix, '') || '/';

  return (
    <nav
      aria-label={t('mainNav')}
      className="bg-background/95 border-border-subtle fixed inset-x-0 bottom-0 z-40 min-h-[var(--bottom-nav-height)] border-t backdrop-blur lg:hidden"
      style={{ paddingBottom: 'var(--safe-area-bottom)' }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(normalizedPathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex flex-1 justify-center">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors motion-reduce:transition-none',
                  active
                    ? item.primary
                      ? 'text-primary-text'
                      : 'text-foreground'
                    : 'text-text-muted hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg transition-colors motion-reduce:transition-none',
                    active && 'bg-primary-subtle',
                    active && item.primary && 'bg-primary text-primary-foreground',
                  )}
                >
                  <Icon className="h-4.5 w-4.5" aria-hidden />
                </span>
                <span className="truncate">{t(item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
