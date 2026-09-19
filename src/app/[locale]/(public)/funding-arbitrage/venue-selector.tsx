'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { Venue } from '@/types/funding-arbitrage';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';

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
        ? `1 venue`
        : `${selected.length} venues`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<div />}>
        <Button variant="outline" disabled={disabled} className="min-w-[180px] justify-between">
          {label}
          <ChevronDownIcon className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Venues (2-10)</DropdownMenuLabel>
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
        {venues.map((venue) => (
          <DropdownMenuCheckboxItem
            key={venue.id}
            checked={selected.includes(venue.id)}
            onCheckedChange={() => toggle(venue.id)}
            disabled={!selected.includes(venue.id) && selected.length >= 10}
          >
            <span className="flex flex-col">
              <span>{venue.name}</span>
              <span className="text-muted-foreground text-xs">{venue.exchange_name}</span>
            </span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
