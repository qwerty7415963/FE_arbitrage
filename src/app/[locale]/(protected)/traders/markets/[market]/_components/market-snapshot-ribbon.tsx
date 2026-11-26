'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { formatUsd } from '@/lib/trader-format';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { MarketSnapshot } from '@/types/trader';

export interface MarketSnapshotRibbonProps {
  snapshot?: MarketSnapshot | null;
  data?: { snapshot?: MarketSnapshot | null } | null;
  detail?: { snapshot?: MarketSnapshot | null } | null;
}

function dash(v: React.ReactNode): React.ReactNode {
  return v ?? '—';
}

export function MarketSnapshotRibbon(props: MarketSnapshotRibbonProps) {
  const t = useTranslations('traders');
  const snapshot = props.snapshot ?? props.data?.snapshot ?? props.detail?.snapshot ?? null;

  const longNotional = snapshot?.open_notional_long ?? 0;
  const shortNotional = snapshot?.open_notional_short ?? 0;
  const totalNotional = longNotional + shortNotional;
  const longPct = totalNotional > 0 ? Math.round((longNotional / totalNotional) * 100) : 0;
  const shortPct = totalNotional > 0 ? 100 - longPct : 0;

  const cell = (v: React.ReactNode) => <span className="text-sm font-medium">{dash(v)}</span>;

  const rows: {
    label: string;
    long: React.ReactNode;
    short: React.ReactNode;
    total: React.ReactNode;
  }[] = [
    {
      label: t('openNotional'),
      long: formatUsd(snapshot?.open_notional_long),
      short: formatUsd(snapshot?.open_notional_short),
      total: formatUsd(totalNotional),
    },
    {
      label: t('unrealizedPnl'),
      long: formatUsd(snapshot?.unrealized_pnl_long),
      short: formatUsd(snapshot?.unrealized_pnl_short),
      total: formatUsd(snapshot?.net_unrealized_pnl ?? null),
    },
    {
      label: t('traders'),
      long: snapshot?.traders_long,
      short: snapshot?.traders_short,
      total: snapshot?.traders_total,
    },
    {
      label: t('marginUsed'),
      long: formatUsd(snapshot?.margin_used_long),
      short: formatUsd(snapshot?.margin_used_short),
      total: formatUsd(snapshot?.margin_used_total ?? null),
    },
  ];

  return (
    <div
      data-testid="market-snapshot-ribbon"
      className="bg-surface border-border-subtle rounded-xl border p-4"
    >
      <div className="grid grid-cols-4 gap-2">
        <div />
        <div className="text-muted-foreground text-xs font-medium">{t('long')}</div>
        <div className="text-muted-foreground text-xs font-medium">{t('short')}</div>
        <div className="text-muted-foreground text-xs font-medium">{t('total')}</div>
        {rows.map((r) => (
          <React.Fragment key={r.label}>
            <div className="text-muted-foreground text-xs">{r.label}</div>
            <div>{cell(r.long)}</div>
            <div>{cell(r.short)}</div>
            <div>{cell(r.total)}</div>
          </React.Fragment>
        ))}
      </div>
      <div className="mt-4">
        <div className="text-muted-foreground mb-1 text-xs">{t('marketDetail.longShortRatio')}</div>
        {totalNotional > 0 ? (
          <>
            <div className="bg-muted flex h-2 overflow-hidden rounded-full">
              <div className="bg-direction-long" style={{ width: `${longPct}%` }} />
              <div className="bg-direction-short" style={{ width: `${shortPct}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-xs">
              <span>{longPct}%</span>
              <span>{shortPct}%</span>
            </div>
          </>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </div>
      <div className="mt-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="bg-muted rounded px-2 py-0.5 text-xs">
              {t('marketDetail.trackedWallets')} · {t('marketDetail.synced')}
            </TooltipTrigger>
            <TooltipContent>
              {t('marketDetail.trackedWallets')} · {t('marketDetail.synced')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
