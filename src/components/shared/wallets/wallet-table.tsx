'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { GroupWallet, Wallet } from '@/types/wallet-scan';

interface WalletTableProps {
  wallets: (Wallet | GroupWallet)[] | undefined | null;
  selectable?: boolean;
  selected?: string[];
  onSelect?: (ids: string[]) => void;
  renderActions?: (wallet: Wallet | GroupWallet) => React.ReactNode;
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined) return 'N/A';
  return value.toFixed(digits);
}

export function WalletTable({
  wallets,
  selectable,
  selected,
  onSelect,
  renderActions,
}: WalletTableProps) {
  const rows = wallets ?? [];
  const selectedIds = selected ?? [];

  if (rows.length === 0) {
    return <div className="text-muted-foreground py-8 text-center">No wallets found</div>;
  }

  const allSelected = rows.length > 0 && rows.every((w) => selectedIds.includes(w.id));

  function toggleAll() {
    if (!onSelect) return;
    onSelect(allSelected ? [] : rows.map((w) => w.id));
  }

  function toggleOne(id: string) {
    if (!onSelect) return;
    onSelect(selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]);
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {selectable && (
            <TableHead>
              <input
                type="checkbox"
                aria-label="Select all"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4"
              />
            </TableHead>
          )}
          <TableHead>Address</TableHead>
          <TableHead>Chain</TableHead>
          <TableHead>DEX</TableHead>
          <TableHead>Tag</TableHead>
          <TableHead>PnL</TableHead>
          <TableHead>ROI</TableHead>
          <TableHead>Win Rate</TableHead>
          <TableHead>Volume</TableHead>
          <TableHead>Trades</TableHead>
          <TableHead>Leverage</TableHead>
          <TableHead>Last Active</TableHead>
          {renderActions && <TableHead />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((w) => (
          <TableRow key={w.id}>
            {selectable && (
              <TableCell>
                <input
                  type="checkbox"
                  aria-label={`Select ${w.address}`}
                  checked={selectedIds.includes(w.id)}
                  onChange={() => toggleOne(w.id)}
                  className="h-4 w-4"
                />
              </TableCell>
            )}
            <TableCell className="font-mono text-xs" title={w.address}>
              {truncateAddress(w.address)}
            </TableCell>
            <TableCell>{w.chain}</TableCell>
            <TableCell>{w.dex ?? 'N/A'}</TableCell>
            <TableCell>{w.tag ?? 'N/A'}</TableCell>
            <TableCell
              className={(w.metrics?.realized_pnl ?? 0) >= 0 ? 'text-primary' : 'text-destructive'}
            >
              {formatNumber(w.metrics?.realized_pnl)}
            </TableCell>
            <TableCell>{formatNumber(w.metrics?.roi)}%</TableCell>
            <TableCell>{formatNumber(w.metrics?.win_rate)}%</TableCell>
            <TableCell>{formatNumber(w.metrics?.volume)}</TableCell>
            <TableCell>{w.metrics?.trade_count ?? 'N/A'}</TableCell>
            <TableCell>{formatNumber(w.metrics?.avg_leverage)}x</TableCell>
            <TableCell className="text-xs">
              {w.metrics?.last_active_at
                ? new Date(w.metrics.last_active_at).toLocaleString()
                : 'N/A'}
            </TableCell>
            {renderActions && <TableCell>{renderActions(w)}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
