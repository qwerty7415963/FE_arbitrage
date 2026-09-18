'use client';

import { cn } from '@/lib/utils';
import { SidebarHeader } from './sidebar-header';
import { SidebarNav } from './sidebar-nav';
import { SidebarFooter } from './sidebar-footer';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <aside className={cn('bg-background flex h-full w-64 flex-col border-r', className)}>
      <SidebarHeader />
      <SidebarNav />
      <SidebarFooter />
    </aside>
  );
}

export { SidebarHeader } from './sidebar-header';
export { SidebarNav } from './sidebar-nav';
export { SidebarFooter } from './sidebar-footer';
