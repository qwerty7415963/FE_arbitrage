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

interface FundingTableProps {
  pairs: ArbitragePair[] | undefined | null;
}

function flattenPairs(
  pairs: ArbitragePair[] | undefined | null,
): (ArbitrageToken & { venue_a_name: string; venue_b_name: string })[] {
  const rows: (ArbitrageToken & { venue_a_name: string; venue_b_name: string })[] = [];
  for (const pair of pairs ?? []) {
    for (const token of pair.tokens ?? []) {
      rows.push({
        ...token,
        venue_a_name: pair.venue_a?.name ?? '—',
        venue_b_name: pair.venue_b?.name ?? '—',
      });
    }
  }
  return rows;
}

function formatPercent(value: number | undefined | null): string {
  return `${(value ?? 0).toFixed(2)}%`;
}

function StatusBadge({
  funding_available,
  is_stale,
}: {
  funding_available: boolean;
  is_stale: boolean;
}) {
  if (!funding_available) {
    return (
      <span className="inline-flex items-center rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
        Unavailable
      </span>
    );
  }
  if (is_stale) {
    return (
      <span className="inline-flex items-center rounded-md bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-400">
        Stale
      </span>
    );
  }
  return (
    <span className="bg-primary/10 text-primary inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium">
      Live
    </span>
  );
}

export function FundingTable({ pairs }: FundingTableProps) {
  const rows = flattenPairs(pairs);

  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">No arbitrage opportunities found</div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Token</TableHead>
          <TableHead>Long (Venue A)</TableHead>
          <TableHead>Rate A</TableHead>
          <TableHead>Short (Venue B)</TableHead>
          <TableHead>Rate B</TableHead>
          <TableHead>Rate 8h</TableHead>
          <TableHead>Rate 1h</TableHead>
          <TableHead>APR</TableHead>
          <TableHead>Spread</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, idx) => (
          <TableRow key={`${row.instrument_id}-${idx}`}>
            <TableCell className="font-medium">{row.symbol}</TableCell>
            <TableCell>{row.venue_a_name}</TableCell>
            <TableCell className="font-mono text-xs">{row.venue_a_funding_rate}</TableCell>
            <TableCell>{row.venue_b_name}</TableCell>
            <TableCell className="font-mono text-xs">{row.venue_b_funding_rate}</TableCell>
            <TableCell
              className={(row.rate_8h_percent ?? 0) > 0 ? 'text-primary' : 'text-destructive'}
            >
              {formatPercent(row.rate_8h_percent)}
            </TableCell>
            <TableCell
              className={(row.rate_1h_percent ?? 0) > 0 ? 'text-primary' : 'text-destructive'}
            >
              {formatPercent(row.rate_1h_percent)}
            </TableCell>
            <TableCell>{formatPercent(row.apr_percent)}</TableCell>
            <TableCell>{formatPercent(row.price_spread_percent)}</TableCell>
            <TableCell>
              <StatusBadge funding_available={row.funding_available} is_stale={row.is_stale} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
