'use client';

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

export function SidebarFooter() {
  const t = useTranslations('navigation');

  return (
    <div className="border-t p-4">
      <DropdownMenu>
        <DropdownMenuTrigger render={<div className="w-full" />} nativeButton={false}>
          <Button variant="ghost" className="w-full justify-start gap-3">
            <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium">User</span>
              <span className="text-muted-foreground text-xs">user@example.com</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem>
            <SettingsIcon className="mr-2 h-4 w-4" />
            {t('settings')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <LogOutIcon className="mr-2 h-4 w-4" />
            {t('logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
