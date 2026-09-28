'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { Venue } from '@/types/funding-arbitrage';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VenueSelectorProps {
  venues: Venue[];
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function VenueSelector({ venues, selected, onChange, disabled }: VenueSelectorProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((v) => v !== id));
    } else {
      if (selected.length < 10) {
        onChange([...selected, id]);
      }
    }
  };

  const selectAll = () => {
    onChange(venues.slice(0, 10).map((v) => v.id));
  };

  const clearAll = () => {
    onChange([]);
  };

  const label =
    selected.length === 0
      ? 'Select venues'
      : selected.length === 1
        ? '1 venue'
        : `${selected.length} venues`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<div />} nativeButton={false}>
        <Button variant="outline" disabled={disabled} className="min-w-[180px] justify-between">
          {label}
          <ChevronDownIcon className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Venues (2-10)</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="flex gap-1 px-1.5 py-1">
          <Button variant="ghost" size="sm" onClick={selectAll} className="h-6 text-xs">
            Select All
          </Button>
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-6 text-xs">
            Clear
          </Button>
        </div>
        <DropdownMenuSeparator />
        {venues.map((venue) => {
          const isSelected = selected.includes(venue.id);
          return (
            <div
              key={venue.id}
              role="menuitem"
              data-slot="dropdown-menu-item"
              onClick={() => toggle(venue.id)}
              className={cn(
                'focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none',
                !isSelected && selected.length >= 10 && 'pointer-events-none opacity-50',
              )}
            >
              <CheckIcon
                className={cn('h-4 w-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')}
              />
              <span className="flex flex-col">
                <span>{venue.name}</span>
                <span className="text-muted-foreground text-xs">{venue.code}</span>
              </span>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
