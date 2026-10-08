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
  now = Date.now(),
): string | null {
  if (!iso) return null;
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  const diffSec = Math.max(0, Math.floor((now - time) / 1000));
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export function formatDateTimeUtc(iso: string | null | undefined): string | null {
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
