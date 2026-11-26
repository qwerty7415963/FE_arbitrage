'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/infrastructure/api-client';
import { mapErrorCode } from '@/lib/error-mapping';
import { getGroupsCompare, listTraderGroupsDetailed } from '@/services/traders';
import type { GroupCompareResponse, GroupListItem } from '@/types/trader';
import { useAuthStore } from '@/lib/stores/auth';
import { useAuthGate } from '@/hooks/use-auth-gate';
import { ConnectWalletButton } from '@/components/shared/auth/connect-wallet-button';
import {
  formatDecimal,
  formatPercent,
  formatSignedPercent,
  formatSignedUsd,
  formatUsd,
} from '@/lib/trader-format';
import { NULL_DISPLAY } from '@/components/shared/traders/trader-table';
import { Link } from '@/i18n/navigation';

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
  'var(--info)',
  'var(--warning)',
];

type Period = '7D' | '30D' | '90D' | 'ALL';

export default function GroupsComparePage() {
  const t = useTranslations('groups');
  const te = useTranslations();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [groupsError, setGroupsError] = useState<unknown>(null);

  const [selected, setSelected] = useState<string[]>([]);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('30D');
  const [compareData, setCompareData] = useState<GroupCompareResponse | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [compareError, setCompareError] = useState<unknown>(null);

  const gate = useAuthGate({ isAuthenticated, isLoading: isLoadingGroups, error: groupsError });

  const fetchGroups = useCallback(async () => {
    setIsLoadingGroups(true);
    setGroupsError(null);
    try {
      const res = await listTraderGroupsDetailed({ page: 1, page_size: 100 });
      setGroups(res.items);
    } catch (err) {
      setGroupsError(err);
    } finally {
      setIsLoadingGroups(false);
    }
  }, []);

  useEffect(() => {
    async function run() {
      if (!isAuthenticated) {
        setGroups([]);
        setIsLoadingGroups(false);
        return;
      }
      await fetchGroups();
    }
    void run();
  }, [fetchGroups, isAuthenticated]);

  const canCompare = selected.length >= 2 && selected.length <= 10;

  const runCompare = useCallback(
    async (ids: string[] = selected) => {
      if (ids.length < 2 || ids.length > 10) return;
      setIsComparing(true);
      setCompareError(null);
      try {
        setCompareData(await getGroupsCompare(ids, period));
      } catch (err) {
        setCompareError(err);
        setCompareData(null);
      } finally {
        setIsComparing(false);
      }
    },
    [period, selected],
  );

  // Auto-run when selection/period changes if already have data
  useEffect(() => {
    async function run() {
      if (compareData && canCompare) {
        await runCompare();
      }
    }
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  function toggleSelect(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function removeGroup(id: string) {
    const next = selected.filter((x) => x !== id);
    setSelected(next);
    if (next.length >= 2) {
      void runCompare(next);
    } else {
      setCompareData(null);
    }
  }

  const compareErrorMessage =
    compareError instanceof ApiError
      ? te(mapErrorCode(compareError.code), { defaultValue: te('errors.unknown') })
      : compareError instanceof Error
        ? compareError.message
        : t('unknownError');

  // chart data
  const seriesByGroup = useMemo(() => {
    if (!compareData) return new Map();
    const map = new Map<string, { t: number; v: number }[]>();
    for (const s of compareData.series) {
      const pts = (s.points ?? [])
        .map((p) => ({ t: Date.parse(p.t), v: p.roi_index }))
        .filter((p) => Number.isFinite(p.t) && p.v != null) as { t: number; v: number }[];
      pts.sort((a, b) => a.t - b.t);
      map.set(s.group_id, pts);
    }
    return map;
  }, [compareData]);

  const allTimes = useMemo(() => {
    const set = new Set<number>();
    for (const pts of seriesByGroup.values()) for (const p of pts) set.add(p.t);
    return [...set].sort((a, b) => a - b);
  }, [seriesByGroup]);

  const W = 640;
  const H = 220;
  const maxV = useMemo(() => {
    let max = 100;
    for (const pts of seriesByGroup.values()) for (const p of pts) max = Math.max(max, p.v);
    let min = 100;
    for (const pts of seriesByGroup.values()) for (const p of pts) min = Math.min(min, p.v);
    // pad
    return { min: Math.min(100, min), max: Math.max(100, max) };
  }, [seriesByGroup]);

  function xForTime(t: number) {
    if (allTimes.length <= 1) return 0;
    const i = allTimes.indexOf(t);
    return (i / (allTimes.length - 1)) * W;
  }
  function yForValue(v: number) {
    const range = maxV.max - maxV.min || 1;
    return H - ((v - maxV.min) / range) * H;
  }

  const metrics: {
    key: string;
    label: string;
    getter: (s: GroupCompareResponse['groups'][number]['stats']) => number | null;
    format: (v: number | null) => string;
    higherBetter: boolean;
  }[] = [
    {
      key: 'account_value',
      label: t('accountValue'),
      getter: (s) => s.account_value,
      format: (v) => formatUsd(v) ?? NULL_DISPLAY,
      higherBetter: true,
    },
    {
      key: 'unrealized_pnl',
      label: t('unrealizedPnl'),
      getter: (s) => s.unrealized_pnl,
      format: (v) => formatSignedUsd(v),
      higherBetter: true,
    },
    {
      key: 'realized_pnl',
      label: t('realizedPnl'),
      getter: (s) => s.realized_pnl,
      format: (v) => formatSignedUsd(v),
      higherBetter: true,
    },
    {
      key: 'roi',
      label: t('roi'),
      getter: (s) => s.roi,
      format: (v) => (v == null ? NULL_DISPLAY : (formatSignedPercent(v * 100) ?? NULL_DISPLAY)),
      higherBetter: true,
    },
    {
      key: 'win_rate',
      label: t('winRate'),
      getter: (s) => s.win_rate,
      format: (v) => (v == null ? NULL_DISPLAY : (formatPercent(v * 100) ?? NULL_DISPLAY)),
      higherBetter: true,
    },
    {
      key: 'volume',
      label: t('volume'),
      getter: (s) => s.volume,
      format: (v) => formatUsd(v) ?? NULL_DISPLAY,
      higherBetter: true,
    },
    {
      key: 'profit_factor',
      label: t('profitFactor'),
      getter: (s) => s.profit_factor,
      format: (v) => formatDecimal(v) ?? NULL_DISPLAY,
      higherBetter: true,
    },
    {
      key: 'max_drawdown_pct',
      label: t('maxDrawdown'),
      getter: (s) => s.max_drawdown_pct,
      format: (v) => (v == null ? NULL_DISPLAY : (formatPercent(v) ?? NULL_DISPLAY)),
      higherBetter: false,
    },
    {
      key: 'open_positions',
      label: t('openPositions'),
      getter: (s) => s.open_positions,
      format: (v) => (v == null ? NULL_DISPLAY : String(v)),
      higherBetter: true,
    },
    {
      key: 'trade_count',
      label: t('tradeCount'),
      getter: (s) => s.trade_count,
      format: (v) => (v == null ? NULL_DISPLAY : String(v)),
      higherBetter: true,
    },
    {
      key: 'total_notional',
      label: t('totalNotional'),
      getter: (s) => s.total_notional,
      format: (v) => formatUsd(v) ?? NULL_DISPLAY,
      higherBetter: true,
    },
  ];

  if (isLoadingGroups) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (gate === 'unauthenticated') {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <h1 className="text-2xl font-bold">{t('compare')}</h1>
        <div className="text-muted-foreground py-12 text-center">
          <p>{t('authRequired')}</p>
          <div className="mt-4 inline-flex">
            <ConnectWalletButton />
          </div>
        </div>
      </div>
    );
  }

  if (groupsError) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {groupsError instanceof ApiError
            ? te(mapErrorCode(groupsError.code), { defaultValue: te('errors.unknown') })
            : groupsError instanceof Error
              ? groupsError.message
              : t('unknownError')}{' '}
          <Button variant="link" size="sm" onClick={fetchGroups}>
            {t('retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('compare')}</h1>
        <Link href="/groups">
          <Button variant="outline" size="sm">
            {t('title')}
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(['7D', '30D', '90D', 'ALL'] as Period[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(p)}
          >
            {p === 'ALL' ? t('rangeAll') : p}
          </Button>
        ))}
      </div>

      <div className="rounded-lg border p-3">
        <h2 className="mb-2 text-sm font-semibold">{t('selectGroups') ?? 'Select groups'}</h2>
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => {
            const isSelected = selected.includes(g.id);
            return (
              <label
                key={g.id}
                className="flex items-center gap-2 rounded border px-2 py-1 text-sm"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(g.id)}
                  disabled={!isSelected && selected.length >= 10}
                />
                <span>{g.name}</span>
              </label>
            );
          })}
        </div>
        {groups.length === 0 && <p className="text-muted-foreground text-sm">{t('noGroups')}</p>}
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={() => void runCompare()} disabled={!canCompare || isComparing}>
          {isComparing ? t('loading') : t('compare')}
        </Button>
        <span className="text-muted-foreground text-xs">{selected.length} selected (2-10)</span>
      </div>

      {compareError ? (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {compareErrorMessage}{' '}
          <Button variant="link" size="sm" onClick={() => void runCompare()}>
            {t('retry')}
          </Button>
        </div>
      ) : null}

      {isComparing && !compareData ? (
        <Skeleton className="h-64 w-full" />
      ) : compareData ? (
        <>
          {compareData.warnings?.length ? (
            <div className="border-warning/30 bg-warning-subtle text-warning rounded-md border p-3 text-sm">
              {compareData.warnings.join(' ')}
            </div>
          ) : null}

          {/* Chart */}
          <div className="rounded-lg border p-3">
            <h2 className="mb-2 text-sm font-semibold">{t('chartTitle')}</h2>
            {seriesByGroup.size === 0 || allTimes.length < 2 ? (
              <div className="text-muted-foreground flex h-[220px] items-center justify-center text-sm">
                {t('insufficientData')}
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="h-[220px] w-full"
                role="img"
                aria-label={t('chartTitle')}
              >
                <line
                  x1={0}
                  y1={yForValue(100)}
                  x2={W}
                  y2={yForValue(100)}
                  className="stroke-border"
                  strokeWidth={1}
                />
                {compareData.groups.map((g, idx) => {
                  const pts = (seriesByGroup.get(g.id) ?? []) as { t: number; v: number }[];
                  if (pts.length === 0) return null;
                  const path = pts
                    .map(
                      (p, i) =>
                        `${i === 0 ? 'M' : 'L'}${xForTime(p.t).toFixed(1)},${yForValue(p.v).toFixed(1)}`,
                    )
                    .join(' ');
                  const color = COLORS[idx % COLORS.length];
                  const isActive = hoveredGroup === null || hoveredGroup === g.id;
                  return (
                    <path
                      key={g.id}
                      d={path}
                      fill="none"
                      stroke={color}
                      strokeWidth={isActive ? 2 : 1}
                      opacity={isActive ? 1 : 0.35}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              </svg>
            )}
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              {compareData.groups.map((g, idx) => {
                const isActive = hoveredGroup === null || hoveredGroup === g.id;
                return (
                  <span
                    key={g.id}
                    className={`flex items-center gap-1 transition-opacity ${
                      isActive ? 'opacity-100' : 'opacity-40'
                    }`}
                    onMouseEnter={() => setHoveredGroup(g.id)}
                    onMouseLeave={() => setHoveredGroup(null)}
                  >
                    <span
                      className={`inline-block h-2 w-4 ${isActive ? 'ring-foreground/40 ring-1' : ''}`}
                      style={{ background: COLORS[idx % COLORS.length] }}
                    />
                    {g.name}
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground ml-1"
                      onClick={() => removeGroup(g.id)}
                      aria-label={`remove ${g.name}`}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Metrics table */}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">{t('metric')}</th>
                  {compareData.groups.map((g) => (
                    <th key={g.id} className="p-2 text-right">
                      {g.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => {
                  const values = compareData.groups.map((g) => m.getter(g.stats));
                  const numeric = values.filter((v): v is number => v != null);
                  const best = numeric.length
                    ? m.higherBetter
                      ? Math.max(...numeric)
                      : Math.min(...numeric)
                    : null;
                  const worst = numeric.length
                    ? m.higherBetter
                      ? Math.min(...numeric)
                      : Math.max(...numeric)
                    : null;
                  return (
                    <tr key={m.key} className="border-b last:border-0">
                      <td className="p-2 font-medium">{m.label}</td>
                      {values.map((v, i) => {
                        const isBest = v != null && v === best && best !== worst;
                        const isWorst = v != null && v === worst && best !== worst;
                        return (
                          <td
                            key={compareData.groups[i].id}
                            className={`p-2 text-right tabular-nums ${isBest ? 'text-financial-positive font-semibold' : isWorst ? 'text-financial-negative' : ''}`}
                          >
                            {m.format(v)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {compareData.overlap?.pairwise?.length ? (
            <div className="text-muted-foreground text-xs">
              {compareData.overlap.pairwise.map((p) => {
                const nameA = compareData.groups.find((g) => g.id === p.a)?.name ?? p.a;
                const nameB = compareData.groups.find((g) => g.id === p.b)?.name ?? p.b;
                return (
                  <div key={`${p.a}-${p.b}`}>
                    {nameA} ↔ {nameB}: {p.shared_wallets} shared wallets
                  </div>
                );
              })}
            </div>
          ) : null}
        </>
      ) : (
        <div className="text-muted-foreground py-8 text-center text-sm">{t('noGroupsHint')}</div>
      )}
    </div>
  );
}
