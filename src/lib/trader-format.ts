export function formatPrice(value: number | null | undefined): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 1000) {
    return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (abs >= 1) {
    return `${sign}$${abs.toFixed(2)}`;
  }
  if (abs >= 0.01) {
    return `${sign}$${abs.toFixed(4)}`;
  }
  if (abs === 0) {
    return `${sign}$0.00`;
  }
  const log = Math.floor(Math.log10(abs));
  const decimals = Math.min(Math.max(0, 6 - log - 1), 20);
  let s = abs.toFixed(decimals);
  s = s.replace(/\.?0+$/, '');
  if (s === '' || s === '.') s = '0';
  return `${sign}$${s}`;
}

export function formatUsd(value: number | null | undefined): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(2)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

export function formatSignedPercent(value: number | null | undefined, digits = 2): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const sign = value < 0 ? '-' : '+';
  return `${sign}${Math.abs(value).toFixed(digits)}%`;
}

export function formatPercent(value: number | null | undefined, digits = 2): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return `${value.toFixed(digits)}%`;
}

export function formatDecimal(value: number | null | undefined, digits = 2): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return value.toFixed(digits);
}

export function formatCompactNumber(value: number | null | undefined): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

export function formatInteger(value: number | null | undefined): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return Math.trunc(value).toLocaleString('en-US');
}

export function deriveWinRate(
  wins: number | null | undefined,
  count: number | null | undefined,
): number | null {
  if (wins === null || wins === undefined || count === null || count === undefined) return null;
  if (count <= 0) return null;
  return (100 * wins) / count;
}

export function formatRelativeTime(
  iso: string | null | undefined,
  nowOrLocale: number | string = Date.now(),
  locale?: string,
): string | null {
  let now = Date.now();
  let resolvedLocale = 'vi';
  if (typeof nowOrLocale === 'string') {
    resolvedLocale = nowOrLocale;
  } else if (typeof nowOrLocale === 'number') {
    now = nowOrLocale;
    if (locale) resolvedLocale = locale;
  }
  // Relative-time abbreviations intentionally stay in English for now; localized strings are handled by components.
  void resolvedLocale;
  if (!iso) return null;
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  const diffSec = Math.max(0, Math.floor((now - time) / 1000));
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export function formatRelativeTimeLocalized(
  iso: string | null | undefined,
  locale = 'en',
): string | null {
  if (!iso) return null;
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  const diffSec = Math.max(0, Math.floor((Date.now() - time) / 1000));
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (diffSec < 60) return rtf.format(0, 'second');
  if (diffSec < 3600) return rtf.format(-Math.floor(diffSec / 60), 'minute');
  if (diffSec < 86400) return rtf.format(-Math.floor(diffSec / 3600), 'hour');
  return rtf.format(-Math.floor(diffSec / 86400), 'day');
}

export function formatDateTimeUtc(iso: string | null | undefined, locale = 'en'): string | null {
  // locale is accepted for API parity; date output stays UTC and grouping stays en-US by design.
  void locale;
  if (!iso) return null;
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  return `${new Date(time).toISOString().slice(0, 19).replace('T', ' ')} UTC`;
}

export function shortAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const NULL_GLYPH = '—';

export function formatSignedUsd(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return NULL_GLYPH;
  const sign = value < 0 ? '-' : '+';
  const abs = Math.abs(value);
  const grouped = abs.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${sign}$${grouped}`;
}

export function formatSignedPct(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return NULL_GLYPH;
  const sign = value < 0 ? '-' : '+';
  return `${sign}${Math.abs(value).toFixed(digits)}%`;
}

export function formatNumber(value: number | null | undefined, digits = 4): string {
  if (value === null || value === undefined || Number.isNaN(value)) return NULL_GLYPH;
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function formatTpSlList(
  prices: number[] | null | undefined,
  max = 2,
): { text: string; title: string | null } {
  const list = prices ?? [];
  if (list.length === 0) return { text: '—', title: null };
  const formatted = list.map((p) => formatUsd(p) ?? '—');
  const shown = formatted.slice(0, max);
  const text =
    list.length <= max ? shown.join(' · ') : `${shown.join(' · ')} +${list.length - max}`;
  const title = formatted.join(', ');
  return { text, title };
}

export function formatDurationSec(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value) || value < 0) return NULL_GLYPH;
  const totalSec = Math.floor(value);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${totalSec}s`;
}

export type ActivityTone = 'positive' | 'negative';

export function activitySideTone(side: 'LONG' | 'SHORT' | 'BUY' | 'SELL' | string): ActivityTone {
  if (side === 'LONG' || side === 'BUY') return 'positive';
  return 'negative';
}
