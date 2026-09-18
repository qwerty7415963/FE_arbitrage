'use client';

import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { LayoutDashboardIcon, SettingsIcon, type LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  icon: LucideIcon;
  labelKey: string;
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    icon: LayoutDashboardIcon,
    labelKey: 'dashboard',
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

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navItems.map((item) => {
        const isActive = pathname.includes(item.href);
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
