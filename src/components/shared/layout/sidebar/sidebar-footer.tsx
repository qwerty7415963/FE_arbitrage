'use client';

import { useRouter } from '@/i18n/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { UserIcon, SettingsIcon, LogOutIcon } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth';

export function SidebarFooter() {
  const t = useTranslations('navigation');
  const router = useRouter();
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <div className="border-t p-4">
      <DropdownMenu>
        <DropdownMenuTrigger render={<div className="w-full" />} nativeButton={false}>
          <Button variant="ghost" className="w-full justify-start gap-3">
            <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="flex flex-1 flex-col items-start text-left">
              <span className="text-sm font-medium">{user?.email || 'User'}</span>
              <span className="text-muted-foreground text-xs">{user?.role || ''}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            <SettingsIcon className="mr-2 h-4 w-4" />
            {t('settings')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleLogout}>
            <LogOutIcon className="mr-2 h-4 w-4" />
            {t('logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
