'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { locales } from '@/config/i18n';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  TrendingUpIcon,
  SettingsIcon,
  FolderIcon,
  RadarIcon,
  LayoutDashboardIcon,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  href: string;
  icon: LucideIcon;
  labelKey: string;
}

const navItems: NavItem[] = [
  {
    href: '/funding-arbitrage',
    icon: TrendingUpIcon,
    labelKey: 'fundingArbitrage',
  },
  {
    href: '/groups',
    icon: FolderIcon,
    labelKey: 'groups',
  },
  {
    href: '/traders/overview',
    icon: LayoutDashboardIcon,
    labelKey: 'overview',
  },
  {
    href: '/traders',
    icon: RadarIcon,
    labelKey: 'scanner',
  },
  {
    href: '/settings',
    icon: SettingsIcon,
    labelKey: 'settings',
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const t = useTranslations('navigation');

  const localePrefix = new RegExp(`^/(${locales.join('|')})(?=/|$)`);
  const normalizedPathname = pathname.replace(localePrefix, '') || '/';

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navItems.map((item) => {
        const isActive =
          normalizedPathname === item.href ||
          (normalizedPathname.startsWith(item.href + '/') &&
            !(item.href === '/traders' && normalizedPathname.startsWith('/traders/overview')));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
