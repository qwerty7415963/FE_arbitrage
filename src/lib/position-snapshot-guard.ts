export function hasPositionData(
  snapshot:
    | { positions?: unknown[] | null; summary?: { account_value?: number | null } | null }
    | null
    | undefined,
): boolean {
  if (!snapshot) return false;
  if (Array.isArray(snapshot.positions) && snapshot.positions.length > 0) return true;
  const accountValue = snapshot.summary?.account_value ?? null;
  return typeof accountValue === 'number' && accountValue > 0;
}

export function isEmptyPositionSnapshot(
  snapshot:
    | { positions?: unknown[] | null; summary?: { account_value?: number | null } | null }
    | null
    | undefined,
): boolean {
  if (!snapshot) return true;
  const hasPositions = Array.isArray(snapshot.positions) && snapshot.positions.length > 0;
  const accountValue = snapshot.summary?.account_value ?? null;
  const hasAccount = typeof accountValue === 'number' && accountValue > 0;
  return !hasPositions && !hasAccount;
}

export function comparePositionAsOf(
  a: string | null | undefined,
  b: string | null | undefined,
): number | null {
  if (!a || !b) return null;
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (Number.isNaN(ta) || Number.isNaN(tb)) return null;
  if (ta < tb) return -1;
  if (ta === tb) return 0;
  return 1;
}

export interface PositionSnapshotDecision {
  ignore: boolean;
  zeroCount: number;
  refreshing: boolean;
  reason: 'error' | 'stale-empty' | 'zero-first' | 'zero-confirmed' | 'apply';
}

export function decidePositionSnapshot(
  current:
    | {
        data_status?: string;
        positions?: unknown[] | null;
        summary?: { account_value?: number | null } | null;
        as_of?: string | null;
      }
    | null
    | undefined,
  incoming: {
    data_status?: string;
    positions?: unknown[] | null;
    summary?: { account_value?: number | null } | null;
    as_of?: string | null;
  },
  zeroCount: number = 0,
): PositionSnapshotDecision {
  const currentHasData = hasPositionData(current as never);

  if (incoming.data_status === 'error' && current?.data_status === 'ready' && currentHasData) {
    return { ignore: true, zeroCount, refreshing: false, reason: 'error' };
  }

  const incomingEmpty = isEmptyPositionSnapshot(incoming as never);
  if (incomingEmpty && currentHasData) {
    const cmp = comparePositionAsOf(incoming.as_of, current?.as_of);
    if (cmp !== null && cmp <= 0) {
      return { ignore: true, zeroCount, refreshing: false, reason: 'stale-empty' };
    }
    const nextZeroCount = zeroCount + 1;
    if (nextZeroCount < 2) {
      return { ignore: true, zeroCount: nextZeroCount, refreshing: true, reason: 'zero-first' };
    }
    return { ignore: false, zeroCount: nextZeroCount, refreshing: false, reason: 'zero-confirmed' };
  }

  return { ignore: false, zeroCount: 0, refreshing: false, reason: 'apply' };
}

export function shouldApplyPositionSnapshot(
  current: unknown,
  incoming: unknown,
  zeroCount: number = 0,
): boolean {
  return !decidePositionSnapshot(current as never, incoming as never, zeroCount).ignore;
}

export function shouldIgnorePositionSnapshot(
  current: unknown,
  incoming: unknown,
  zeroCount: number = 0,
): boolean {
  return decidePositionSnapshot(current as never, incoming as never, zeroCount).ignore;
}
