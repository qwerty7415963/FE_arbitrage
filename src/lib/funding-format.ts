const DASH = '—';

export function formatFundingRate(rate: string | undefined | null): string {
  const n = parseFloat(rate ?? '');
  if (Number.isNaN(n)) return DASH;
  return `${(n * 100).toFixed(4)}%`;
}

export function formatInterval(seconds: number | undefined | null): string {
  if (seconds === undefined || seconds === null || Number.isNaN(seconds)) return DASH;
  if (seconds === 3600) return '1h';
  if (seconds === 14400) return '4h';
  if (seconds === 28800) return '8h';
  if (seconds === 86400) return '24h';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

export function formatFundingSpread(v: number | undefined | null): string {
  if (v === undefined || v === null || Number.isNaN(v)) return DASH;
  const sign = v < 0 ? '-' : '+';
  return `${sign}${Math.abs(v).toFixed(4)}%/h`;
}

function trimDecimals(n: number, max = 2): string {
  const s = n.toFixed(max);
  return s.replace(/\.?0+$/, '');
}

export function formatApr(v: number | undefined | null): string {
  if (v === undefined || v === null || Number.isNaN(v)) return DASH;
  const sign = v < 0 ? '-' : '+';
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${sign}${trimDecimals(abs / 1_000_000)}M%`;
  if (abs >= 1_000) return `${sign}${trimDecimals(abs / 1_000)}K%`;
  return `${sign}${trimDecimals(abs)}%`;
}

export function formatUsd(oi: string | undefined | null): string {
  const n = parseFloat(oi ?? '');
  if (Number.isNaN(n)) return DASH;
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const one = (x: number) => x.toFixed(1);
  if (abs >= 1_000_000_000) return `${sign}$${one(abs / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${sign}$${one(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `${sign}$${one(abs / 1_000)}K`;
  return `${sign}$${one(abs)}`;
}

export function formatPriceSpread(v: number | undefined | null): string {
  if (v === undefined || v === null || Number.isNaN(v)) return DASH;
  return `${v.toFixed(2)}%`;
}

export function resolveLongShort(
  longVenueId: string | undefined | null,
  venueAId: string | undefined | null,
  venueBId: string | undefined | null,
): 'A' | 'B' | null {
  if (longVenueId === undefined || longVenueId === null) return null;
  if (venueAId === undefined || venueAId === null) return null;
  if (venueBId === undefined || venueBId === null) return null;
  if (longVenueId === venueAId) return 'A';
  if (longVenueId === venueBId) return 'B';
  return null;
}
