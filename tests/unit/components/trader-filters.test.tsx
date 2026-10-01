import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { TraderFilters } from '@/components/shared/traders/trader-filters';
import { defaultDraft, type FilterDraft } from '@/lib/trader-filter-draft';
import enMessages from '@/messages/en.json';

function StatefulFilters({
  initial,
  onSearch,
}: {
  initial?: FilterDraft;
  onSearch?: (draft: FilterDraft) => void;
}) {
  const [draft, setDraft] = useState<FilterDraft>(initial ?? defaultDraft());
  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <TraderFilters
        draft={draft}
        onDraftChange={setDraft}
        onSearch={() => onSearch?.(draft)}
        onReset={() => setDraft(defaultDraft())}
        groups={[]}
      />
    </NextIntlClientProvider>
  );
}

function renderFilters(props: Partial<React.ComponentProps<typeof TraderFilters>> = {}) {
  const defaultProps: React.ComponentProps<typeof TraderFilters> = {
    draft: defaultDraft(),
    onDraftChange: vi.fn(),
    onSearch: vi.fn(),
    onReset: vi.fn(),
    groups: [],
  };
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <TraderFilters {...defaultProps} {...props} />
    </NextIntlClientProvider>,
  );
}

describe('TraderFilters', () => {
  it('renders defaults and auth hint when groups are unavailable', () => {
    renderFilters({ groups: null });
    expect(screen.getByLabelText('Venue')).toHaveValue('hyperliquid');
    expect(screen.getByLabelText('Period')).toHaveValue('30D');
    expect(screen.getByLabelText('ROI Min')).toHaveValue('');
    expect(screen.getByText('Connect your wallet to filter by group')).toBeInTheDocument();
  });

  it('renders group options when loaded', () => {
    renderFilters({
      groups: [{ id: 'g1', user_id: 'u1', name: 'Main', description: null, member_count: 3 }],
    });
    expect(screen.getByRole('option', { name: 'Main' })).toBeInTheDocument();
  });

  it('edits the controlled draft and searches', async () => {
    const user = userEvent.setup();
    const seen: FilterDraft[] = [];
    render(<StatefulFilters onSearch={(d) => seen.push(d)} />);
    await user.type(screen.getByLabelText('ROI Min'), '30');
    await user.type(screen.getByLabelText('Win Rate Min'), '60');
    await user.type(screen.getByLabelText('Win Rate Max'), '100');
    await user.selectOptions(screen.getByLabelText('Period'), '7D');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(seen).toHaveLength(1);
    expect(seen[0].ranges.roi).toEqual({ min: '30', max: '' });
    expect(seen[0].ranges.winRate).toEqual({ min: '60', max: '100' });
    expect(seen[0].period).toBe('7D');
  });

  it('keeps raw text so the page can validate it', async () => {
    const user = userEvent.setup();
    const seen: FilterDraft[] = [];
    render(<StatefulFilters onSearch={(d) => seen.push(d)} />);
    await user.type(screen.getByLabelText('PnL Min'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(seen[0].ranges.pnl).toEqual({ min: 'abc', max: '' });
  });

  it('calls onReset', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    renderFilters({ onReset });
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('forwards draft changes', async () => {
    const user = userEvent.setup();
    const onDraftChange = vi.fn();
    renderFilters({ onDraftChange });
    await user.type(screen.getByLabelText('Volume Max'), '5');
    expect(onDraftChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ranges: expect.objectContaining({ volume: { min: '', max: '5' } }),
      }),
    );
  });
});
