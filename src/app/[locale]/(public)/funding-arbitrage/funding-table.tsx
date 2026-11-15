'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ArbitrageToken, ArbitragePair } from '@/types/funding-arbitrage';
import { AssetIcon } from '@/components/shared/asset-icon';
import { stripDexPrefix } from '@/lib/asset-meta';
import {
  formatFundingRate,
  formatInterval,
  formatFundingSpread,
  formatApr,
  formatUsd,
  formatPriceSpread,
  resolveLongShort,
} from '@/lib/funding-format';

interface FundingTableProps {
  pairs: ArbitragePair[] | undefined | null;
}

function flattenPairs(pairs: ArbitragePair[] | undefined | null): (ArbitrageToken & {
  venue_a_name: string;
  venue_b_name: string;
  venue_a_id: string;
  venue_b_id: string;
})[] {
  const rows: (ArbitrageToken & {
    venue_a_name: string;
    venue_b_name: string;
    venue_a_id: string;
    venue_b_id: string;
  })[] = [];
  for (const pair of pairs ?? []) {
    for (const token of pair.tokens ?? []) {
      rows.push({
        ...token,
        venue_a_name: pair.venue_a?.name ?? '—',
        venue_b_name: pair.venue_b?.name ?? '—',
        venue_a_id: pair.venue_a?.id ?? '',
        venue_b_id: pair.venue_b?.id ?? '',
      });
    }
  }
  return rows;
}

export function FundingTable({ pairs }: FundingTableProps) {
  const rows = flattenPairs(pairs);

  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">No arbitrage opportunities found</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Pair</TableHead>
            <TableHead>Funding</TableHead>
            <TableHead>Funding Spread</TableHead>
            <TableHead>APR</TableHead>
            <TableHead>OI</TableHead>
            <TableHead>Price Spread</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, idx) => {
            const longShort = resolveLongShort(row.long_venue_id, row.venue_a_id, row.venue_b_id);
            const aIsLong = longShort === null ? true : longShort === 'A'; // default to A when unknown
            const longVenueName = aIsLong ? row.venue_a_name : row.venue_b_name;
            const shortVenueName = aIsLong ? row.venue_b_name : row.venue_a_name;

            const longFunding = aIsLong
              ? formatFundingRate(row.venue_a_funding_rate)
              : formatFundingRate(row.venue_b_funding_rate);
            const longInterval = aIsLong
              ? formatInterval(row.venue_a_interval_seconds)
              : formatInterval(row.venue_b_interval_seconds);
            const shortFunding = aIsLong
              ? formatFundingRate(row.venue_b_funding_rate)
              : formatFundingRate(row.venue_a_funding_rate);
            const shortInterval = aIsLong
              ? formatInterval(row.venue_b_interval_seconds)
              : formatInterval(row.venue_a_interval_seconds);

            const oiLines = aIsLong
              ? [formatUsd(row.venue_a_oi), formatUsd(row.venue_b_oi)]
              : [formatUsd(row.venue_b_oi), formatUsd(row.venue_a_oi)];

            const spreadValue = row.rate_1h_percent;
            const spreadPrefix = Number.isFinite(spreadValue)
              ? spreadValue! > 0
                ? '▲ '
                : '▼ '
              : '';

            return (
              <TableRow key={`${row.instrument_id}-${idx}`}>
                <TableCell className="font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    {(row.symbol ?? '').trim() !== '' && (
                      <AssetIcon symbol={(row.symbol ?? '').split('-')[0]} size={14} />
                    )}
                    {stripDexPrefix((row.symbol ?? '').replace(/-PERP$/, '')) || '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-sm bg-emerald-500" />
                    <span className="text-emerald-500">LONG</span>
                    <span>{longVenueName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-sm bg-rose-500" />
                    <span className="text-rose-500">SHORT</span>
                    <span>{shortVenueName}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  <div className="flex items-center gap-1.5">
                    <span>{longFunding}</span>
                    <span className="rounded border px-1 text-[10px]">{longInterval}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>{shortFunding}</span>
                    <span className="rounded border px-1 text-[10px]">{shortInterval}</span>
                  </div>
                </TableCell>
                <TableCell
                  className={`font-mono ${Number.isFinite(spreadValue) && spreadValue! > 0 ? 'text-primary' : 'text-destructive'}`}
                >
                  {spreadPrefix}
                  {formatFundingSpread(spreadValue)}
                </TableCell>
                <TableCell className="font-mono">{formatApr(row.apr_percent)}</TableCell>
                <TableCell className="font-mono text-xs">
                  <div>{oiLines[0]}</div>
                  <div>{oiLines[1]}</div>
                </TableCell>
                <TableCell className="font-mono">
                  {formatPriceSpread(row.price_spread_percent)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
