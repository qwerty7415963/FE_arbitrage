import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { FilterSheet } from '@/app/[locale]/(protected)/traders/_components/filter-sheet';
import {
  defaultDraft,
  draftFromQuery,
  draftToQuery,
  type FilterDraft,
} from '@/lib/trader-filter-draft';
import enMessages from '@/messages/en.json';

function Harness({
  initialOpen = false,
  committed = defaultDraft(),
}: {
  initialOpen?: boolean;
  committed?: FilterDraft;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [draft, setDraft] = useState<FilterDraft>(committed);
  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <button type="button" onClick={() => setOpen(true)}>
        open filters
      </button>
      <FilterSheet
        open={open}
        onOpenChange={(next) => setOpen(next)}
        draft={draft}
        onApply={(next) => setDraft(next)}
        onResetFilters={() => setDraft(defaultDraft())}
        onApplySavedSearch={vi.fn()}
        sortBy="pnl"
        sortDirection="desc"
      />
    </NextIntlClientProvider>
  );
}

describe('FilterSheet', () => {
  it('renders three metric clusters and nine metrics, without a group cluster', () => {
    render(<Harness initialOpen />);
    expect(screen.getByRole('group', { name: 'Performance' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Scale and activity' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Order bias' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Group' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Group')).not.toBeInTheDocument();

    expect(screen.getByLabelText('ROI from (%)')).toBeInTheDocument();
    expect(screen.getByLabelText('PnL from ($)')).toBeInTheDocument();
    expect(screen.getByText('Win rate')).toBeInTheDocument();
    expect(screen.getByText('Profit factor')).toBeInTheDocument();
    expect(screen.getByLabelText('Volume from ($)')).toBeInTheDocument();
    expect(screen.getByLabelText('Trades from')).toBeInTheDocument();
    expect(screen.getByText('Last trade')).toBeInTheDocument();
    expect(screen.getByText('Long win rate')).toBeInTheDocument();
    expect(screen.getByText('Short win rate')).toBeInTheDocument();
  });

  it('is a dialog labelled by its heading without aria-modal', () => {
    render(<Harness initialOpen />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toHaveAttribute('aria-modal');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy as string)).toHaveTextContent('Filter traders');
    expect(screen.getByRole('button', { name: 'Close without applying' })).toBeInTheDocument();
  });

  it('reveals the min/max pair from a preset via Custom', async () => {
    const user = userEvent.setup();
    render(<Harness initialOpen />);
    expect(screen.queryByLabelText('Win rate from (%)')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Win rate Custom' }));
    expect(screen.getByLabelText('Win rate from (%)')).toBeInTheDocument();
    expect(screen.getByLabelText('Win rate to (%)')).toBeInTheDocument();
  });

  it('applies a preset as the min value', async () => {
    const user = userEvent.setup();
    render(<Harness initialOpen />);
    await user.click(screen.getByRole('button', { name: 'Win rate 60%' }));
    await user.click(screen.getByRole('button', { name: 'Win rate Custom' }));
    expect(screen.getByLabelText('Win rate from (%)')).toHaveValue('60');
  });

  it('reopens an applied preset as a preset, not Custom', async () => {
    const user = userEvent.setup();
    render(<Harness initialOpen />);
    await user.click(screen.getByRole('button', { name: 'Win rate 60%' }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    await user.click(screen.getByRole('button', { name: 'open filters' }));
    expect(screen.queryByLabelText('Win rate from (%)')).not.toBeInTheDocument();
  });

  it('reopens a profit-factor preset after a URL round-trip normalizes the value', () => {
    const preset = defaultDraft();
    preset.ranges.profitFactor = { min: '1.0', max: '' };
    const roundTripped = draftFromQuery(draftToQuery(preset));
    expect(roundTripped.ranges.profitFactor).toEqual({ min: '1', max: '' });

    render(<Harness initialOpen committed={roundTripped} />);
    expect(screen.getByText('Profit factor')).toBeInTheDocument();
    expect(screen.queryByLabelText('Profit factor from')).not.toBeInTheDocument();
  });

  it('reopens a non-preset value as Custom', async () => {
    const user = userEvent.setup();
    render(<Harness initialOpen />);
    await user.click(screen.getByRole('button', { name: 'Win rate Custom' }));
    await user.type(screen.getByLabelText('Win rate from (%)'), '47');
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    await user.click(screen.getByRole('button', { name: 'open filters' }));
    expect(screen.getByLabelText('Win rate from (%)')).toHaveValue('47');
  });

  it('shows per-field errors while typing and only the first is an alert', async () => {
    const user = userEvent.setup();
    render(<Harness initialOpen />);

    await user.type(screen.getByLabelText('ROI from (%)'), '10');
    await user.type(screen.getByLabelText('ROI to (%)'), '5');
    expect(screen.getByText('From must be less than To')).toBeInTheDocument();
    expect(screen.getByLabelText('ROI from (%)')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('ROI to (%)')).toHaveAttribute('aria-invalid', 'true');

    await user.type(screen.getByLabelText('Trades from'), '1.5');
    expect(screen.getByText('Must be a whole number')).toBeInTheDocument();

    await user.type(screen.getByLabelText('PnL from ($)'), 'abc');
    expect(screen.getByText('Not a number')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Win rate Custom' }));
    await user.type(screen.getByLabelText('Win rate from (%)'), '150');
    expect(screen.getByText('Outside the allowed range')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Last trade Custom' }));
    await user.type(screen.getByLabelText('Last trade after'), 'not-a-date');
    expect(screen.getByText('Invalid date and time')).toBeInTheDocument();

    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('discards the draft when closed with Escape', async () => {
    const user = userEvent.setup();
    render(<Harness initialOpen />);
    await user.type(screen.getByLabelText('ROI from (%)'), '50');
    expect(screen.getByLabelText('ROI from (%)')).toHaveValue('50');

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'open filters' }));
    expect(screen.getByLabelText('ROI from (%)')).toHaveValue('');
  });

  it('returns focus to the opener when closed', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'open filters' });
    await user.click(opener);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it('commits the draft only on Apply', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <FilterSheet
          open
          onOpenChange={vi.fn()}
          draft={defaultDraft()}
          onApply={onApply}
          onResetFilters={vi.fn()}
          onApplySavedSearch={vi.fn()}
          sortBy="pnl"
          sortDirection="desc"
        />
      </NextIntlClientProvider>,
    );
    await user.type(screen.getByLabelText('ROI from (%)'), '30');
    expect(onApply).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0][0].ranges.roi).toEqual({ min: '30', max: '' });
  });
});
