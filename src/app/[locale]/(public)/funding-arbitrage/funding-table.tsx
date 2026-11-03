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
          <TableHead>Long / Short</TableHead>
          <TableHead>Rate A / B</TableHead>
          <TableHead>Rate 8h</TableHead>
          <TableHead>Rate 1h</TableHead>
          <TableHead>APR</TableHead>
          <TableHead>Spread</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, idx) => (
          <TableRow key={`${row.instrument_id}-${idx}`}>
            <TableCell className="font-medium">{row.symbol}</TableCell>
            <TableCell>
              {row.venue_a_name} / {row.venue_b_name}
            </TableCell>
            <TableCell className="font-mono text-xs">
              {row.venue_a_funding_rate} / {row.venue_b_funding_rate}
            </TableCell>
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
