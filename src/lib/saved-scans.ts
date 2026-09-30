import type { GroupWalletQuery } from '@/types/wallet-scan';

export interface SavedScan {
  id: string;
  name: string;
  query: GroupWalletQuery;
  createdAt: string;
}

const STORAGE_KEY = 'perp.saved-scans.v1';

export const MAX_SAVED_SCANS = 20;

const QUERY_KEYS = [
  'search',
  'dex',
  'chain',
  'market',
  'timeframe',
  'start',
  'end',
  'filters',
  'lastActiveWithin',
  'lastActiveFrom',
  'lastActiveTo',
  'sort',
  'order',
] as const;

function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const key of keys) {
    if (obj[key] !== undefined) {
      out[key] = obj[key];
    }
  }
  return out;
}

export function sanitizeScanQuery(query: GroupWalletQuery): GroupWalletQuery {
  return pick(query, QUERY_KEYS);
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `ss-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isSavedScan(value: unknown): value is SavedScan {
  if (!value || typeof value !== 'object') return false;
  const scan = value as Partial<SavedScan>;
  return (
    typeof scan.id === 'string' &&
    typeof scan.name === 'string' &&
    scan.name.trim().length > 0 &&
    !!scan.query &&
    typeof scan.query === 'object'
  );
}

function readRaw(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parseScans(raw: string | null): SavedScan[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedScan);
  } catch {
    return [];
  }
}

type Listener = () => void;

const listeners = new Set<Listener>();
let cachedRaw: string | null | undefined;
let cachedScans: SavedScan[] = [];

function refreshCache(): SavedScan[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedScans = parseScans(raw);
  }
  return cachedScans;
}

function emitChange(): void {
  refreshCache();
  for (const listener of listeners) {
    listener();
  }
}

function onStorage(event: StorageEvent): void {
  if (event.key === STORAGE_KEY || event.key === null) {
    emitChange();
  }
}

export function getSavedScansSnapshot(): SavedScan[] {
  if (typeof window === 'undefined') return [];
  return refreshCache();
}

export function getServerSavedScansSnapshot(): SavedScan[] {
  return [];
}

export function subscribeSavedScans(listener: Listener): () => void {
  if (typeof window === 'undefined') return () => {};
  if (listeners.size === 0) {
    window.addEventListener('storage', onStorage);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener('storage', onStorage);
    }
  };
}

function persist(scans: SavedScan[]): SavedScan[] {
  const trimmed = scans.slice(0, MAX_SAVED_SCANS);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Storage quota exceeded or unavailable — keep in-memory result only.
    }
  }
  emitChange();
  return trimmed;
}

export function listSavedScans(): SavedScan[] {
  return parseScans(readRaw());
}

export function saveSavedScan(name: string, query: GroupWalletQuery): SavedScan | null {
  const trimmedName = name.trim();
  if (!trimmedName) return null;

  const entry: SavedScan = {
    id: createId(),
    name: trimmedName,
    query: sanitizeScanQuery(query),
    createdAt: new Date().toISOString(),
  };

  const rest = listSavedScans().filter((scan) => scan.name !== trimmedName);
  persist([entry, ...rest]);
  return entry;
}

export function removeSavedScan(id: string): SavedScan[] {
  return persist(listSavedScans().filter((scan) => scan.id !== id));
}
