import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { SavedScans } from '@/components/shared/wallets/saved-scans';
import type { GroupWalletQuery } from '@/types/wallet-scan';
import enMessages from '@/messages/en.json';

const STORAGE_KEY = 'perp.saved-scans.v1';

const query: GroupWalletQuery = {
  timeframe: '7D',
  sort: 'roi',
  order: 'desc',
  filters: [{ metric: 'pnl', operator: 'gt', value: 20000 }],
  page: 3,
  limit: 10,
};

function renderSavedScans(props: Partial<React.ComponentProps<typeof SavedScans>> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <SavedScans query={query} onApply={() => {}} {...props} />
    </NextIntlClientProvider>,
  );
}

describe('SavedScans', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders save button and local-storage note when empty', () => {
    renderSavedScans();
    expect(screen.getByRole('button', { name: 'Save search' })).toBeInTheDocument();
    expect(screen.getByText('Stored on this device only')).toBeInTheDocument();
  });

  it('renders previously saved searches from localStorage', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 's1', name: 'Alpha', query: { timeframe: '30D' }, createdAt: '' }]),
    );
    renderSavedScans();
    expect(screen.getByRole('button', { name: 'Alpha' })).toBeInTheDocument();
  });

  it('rejects blank name without saving', () => {
    renderSavedScans();
    fireEvent.click(screen.getByRole('button', { name: 'Save search' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Enter a name')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Alpha' })).not.toBeInTheDocument();
  });

  it('saves current query as a chip', async () => {
    renderSavedScans();
    fireEvent.click(screen.getByRole('button', { name: 'Save search' }));
    fireEvent.change(screen.getByLabelText('Search name'), { target: { value: 'Alpha' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Alpha' })).toBeInTheDocument();
    });
    expect(screen.queryByLabelText('Search name')).not.toBeInTheDocument();
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Alpha');
    expect(stored[0].query.page).toBeUndefined();
  });

  it('applies the saved query without pagination state', async () => {
    const onApply = vi.fn();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 's1', name: 'Alpha', query, createdAt: '' }]),
    );
    renderSavedScans({ onApply });

    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(onApply).toHaveBeenCalledTimes(1);
    const applied = onApply.mock.calls[0][0] as GroupWalletQuery;
    expect(applied.timeframe).toBe('7D');
    expect(applied.filters).toEqual(query.filters);
    expect(applied.page).toBeUndefined();
    expect(applied.limit).toBeUndefined();
  });

  it('removes a saved search', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 's1', name: 'Alpha', query: {}, createdAt: '' }]),
    );
    renderSavedScans();
    fireEvent.click(screen.getByLabelText('Delete Alpha'));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Alpha' })).not.toBeInTheDocument();
    });
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')).toHaveLength(0);
  });

  it('disables interactions while scanning', () => {
    renderSavedScans({ disabled: true });
    expect(screen.getByRole('button', { name: 'Save search' })).toBeDisabled();
  });
});
