'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from 'cn';

export interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
  min?: string;
  max?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseDate(value: string | undefined, fallback: Date): Date {
  if (!value) return new Date(fallback);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date(fallback) : d;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatChip(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${h}:${m}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function firstWeekday(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), 1).getDay();
}

function buildMonthCells(month: Date): (Date | null)[] {
  const cells: (Date | null)[] = [];
  const leading = firstWeekday(month);
  for (let i = 0; i < leading; i++) cells.push(null);
  const total = daysInMonth(month);
  for (let day = 1; day <= total; day++) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  return cells;
}

export function DateRangePicker({ from, to, onChange, min, max }: DateRangePickerProps) {
  const t = useTranslations('traders');
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState<Date>(() =>
    parseDate(from, new Date(now.getTime() - 7 * 86400000)),
  );
  const [draftTo, setDraftTo] = useState<Date>(() => parseDate(to, now));
  const [fromMonth, setFromMonth] = useState<Date>(() =>
    startOfMonth(parseDate(from, new Date(now.getTime() - 7 * 86400000))),
  );
  const [toMonth, setToMonth] = useState<Date>(() => startOfMonth(parseDate(to, now)));
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      const f = parseDate(from, new Date(now.getTime() - 7 * 86400000));
      const tt = parseDate(to, now);
      setDraftFrom(f);
      setDraftTo(tt);
      setFromMonth(startOfMonth(f));
      setToMonth(startOfMonth(tt));
      setError(null);
    }
    setOpen(next);
  };

  const minDate = min ? parseDate(min, now) : null;
  const maxDate = max ? parseDate(max, now) : null;

  const validate = (f: Date, tt: Date): string | null => {
    if (!(f.getTime() < tt.getTime())) return t('marketDetail.invalidRange');
    const spanDays = (tt.getTime() - f.getTime()) / 86400000;
    if (spanDays > 365) return t('marketDetail.spanTooLarge');
    return null;
  };

  const apply = () => {
    const err = validate(draftFrom, draftTo);
    if (err) {
      setError(err);
      return;
    }
    onChange({ from: draftFrom.toISOString(), to: draftTo.toISOString() });
    setOpen(false);
  };

  const applyPreset = (days: number) => {
    const end = maxDate ?? new Date();
    const start = new Date(end.getTime() - days * 86400000);
    onChange({ from: start.toISOString(), to: end.toISOString() });
    setOpen(false);
  };

  const setDay = (target: 'from' | 'to', day: Date) => {
    if (target === 'from') {
      const next = new Date(draftFrom);
      next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
      setDraftFrom(next);
    } else {
      const next = new Date(draftTo);
      next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
      setDraftTo(next);
    }
    setError(null);
  };

  const setTime = (target: 'from' | 'to', type: 'h' | 'm', value: number) => {
    const setter = target === 'from' ? setDraftFrom : setDraftTo;
    setter((prev) => {
      const next = new Date(prev);
      if (type === 'h') next.setHours(value);
      else next.setMinutes(value);
      return next;
    });
    setError(null);
  };

  const isDayDisabled = (day: Date): boolean => {
    if (minDate && day < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()))
      return true;
    if (maxDate && day > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()))
      return true;
    return false;
  };

  const renderMonth = (target: 'from' | 'to', month: Date, setMonth: (d: Date) => void) => {
    const cells = buildMonthCells(month);
    const selected = target === 'from' ? draftFrom : draftTo;
    const rangeStart = draftFrom.getTime() < draftTo.getTime() ? draftFrom : draftTo;
    const rangeEnd = draftFrom.getTime() < draftTo.getTime() ? draftTo : draftFrom;
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            className="hover:bg-muted rounded p-1"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium">
            {MONTHS[month.getMonth()]} {month.getFullYear()}
          </span>
          <button
            type="button"
            aria-label="Next month"
            className="hover:bg-muted rounded p-1"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <span key={d} className="text-muted-foreground font-medium">
              {d}
            </span>
          ))}
          {cells.map((cell, idx) => {
            if (!cell) return <span key={idx} />;
            const disabled = isDayDisabled(cell);
            const isSel = sameDay(cell, selected);
            const inRange =
              cell.getTime() >=
                new Date(
                  rangeStart.getFullYear(),
                  rangeStart.getMonth(),
                  rangeStart.getDate(),
                ).getTime() &&
              cell.getTime() <=
                new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate()).getTime();
            return (
              <button
                key={idx}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setDay(target, cell)}
                className={cn(
                  'h-8 w-8 rounded text-xs',
                  disabled && 'text-muted-foreground/40 cursor-not-allowed',
                  !disabled && 'hover:bg-muted',
                  inRange && !isSel && 'bg-muted',
                  isSel && 'bg-primary text-primary-foreground',
                )}
              >
                {cell.getDate()}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex flex-col text-xs">
            <span className="text-muted-foreground">HH</span>
            <select
              aria-label={`${target} hour`}
              className="border-input bg-background h-9 rounded-md border px-2 text-sm"
              value={selected.getHours()}
              onChange={(e) => setTime(target, 'h', Number(e.target.value))}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {String(i).padStart(2, '0')}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs">
            <span className="text-muted-foreground">MM</span>
            <select
              aria-label={`${target} minute`}
              className="border-input bg-background h-9 rounded-md border px-2 text-sm"
              value={selected.getMinutes()}
              onChange={(e) => setTime(target, 'm', Number(e.target.value))}
            >
              {Array.from({ length: 60 }, (_, i) => (
                <option key={i} value={i}>
                  {String(i).padStart(2, '0')}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    );
  };

  const fromDate = draftFrom;
  const toDate = draftTo;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger className="bg-card inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm">
        <CalendarIcon className="h-4 w-4" />
        <span>
          {formatChip(fromDate)} → {formatChip(toDate)}
        </span>
        <ChevronDownIcon className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent className="w-[22rem] p-4 md:w-[44rem]">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { label: '24H', days: 1 },
              { label: '7D', days: 7 },
              { label: '30D', days: 30 },
              { label: '90D', days: 90 },
            ].map((p) => (
              <Button key={p.label} size="sm" variant="outline" onClick={() => applyPreset(p.days)}>
                {p.label}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-medium">{t('marketDetail.from')}</h3>
              {renderMonth('from', fromMonth, setFromMonth)}
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">{t('marketDetail.to')}</h3>
              {renderMonth('to', toMonth, setToMonth)}
            </div>
          </div>
          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
              {t('marketDetail.cancel')}
            </Button>
            <Button size="sm" onClick={apply}>
              {t('marketDetail.apply')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
