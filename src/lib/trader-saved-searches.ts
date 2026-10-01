import type { TraderSearchQuery } from '@/types/trader';

export interface SavedTraderSearch {
  id: string;
  name: string;
  query: TraderSearchQuery;
  createdAt: string;
}

const STORAGE_KEY = 'trader.saved-searches.v1';

export const MAX_SAVED_SEARCHES = 20;

const QUERY_KEYS = [
  'venue',
  'period',
  'roi',
  'winRate',
  'pnl',
  'volume',
  'tradeCount',
  'profitFactor',
  'longWinRate',
  'shortWinRate',
  'lastTradeAfter',
  'groupId',
  'sortBy',
  'sortDirection',
  'limit',
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

export function sanitizeTraderSearchQuery(query: TraderSearchQuery): TraderSearchQuery {
  return pick(query, QUERY_KEYS);
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `ts-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isSavedSearch(value: unknown): value is SavedTraderSearch {
  if (!value || typeof value !== 'object') return false;
  const search = value as Partial<SavedTraderSearch>;
  return (
    typeof search.id === 'string' &&
    typeof search.name === 'string' &&
    search.name.trim().length > 0 &&
    !!search.query &&
    typeof search.query === 'object'
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

function parseSearches(raw: string | null): SavedTraderSearch[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedSearch);
  } catch {
    return [];
  }
}

type Listener = () => void;

const listeners = new Set<Listener>();
let cachedRaw: string | null | undefined;
let cachedSearches: SavedTraderSearch[] = [];

function refreshCache(): SavedTraderSearch[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSearches = parseSearches(raw);
  }
  return cachedSearches;
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

export function getSavedSearchesSnapshot(): SavedTraderSearch[] {
  if (typeof window === 'undefined') return [];
  return refreshCache();
}

export function getServerSavedSearchesSnapshot(): SavedTraderSearch[] {
  return [];
}

export function subscribeSavedSearches(listener: Listener): () => void {
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

function persist(searches: SavedTraderSearch[]): SavedTraderSearch[] {
  const trimmed = searches.slice(0, MAX_SAVED_SEARCHES);
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

export function listSavedSearches(): SavedTraderSearch[] {
  return parseSearches(readRaw());
}

export function saveSavedSearch(name: string, query: TraderSearchQuery): SavedTraderSearch | null {
  const trimmedName = name.trim();
  if (!trimmedName) return null;

  const entry: SavedTraderSearch = {
    id: createId(),
    name: trimmedName,
    query: sanitizeTraderSearchQuery(query),
    createdAt: new Date().toISOString(),
  };

  const rest = listSavedSearches().filter((search) => search.name !== trimmedName);
  persist([entry, ...rest]);
  return entry;
}

export function removeSavedSearch(id: string): SavedTraderSearch[] {
  return persist(listSavedSearches().filter((search) => search.id !== id));
}
