import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { SavedSearches } from '@/components/shared/traders/saved-searches';
import enMessages from '@/messages/en.json';

function renderSearches(props: Partial<React.ComponentProps<typeof SavedSearches>> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <SavedSearches query={{ period: '7D' }} onApply={vi.fn()} {...props} />
    </NextIntlClientProvider>,
  );
}

describe('SavedSearches', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders as a labelled cluster for the filter sheet', () => {
    renderSearches();
    expect(screen.getByRole('group', { name: 'Saved filters' })).toBeInTheDocument();
  });

  it('saves and applies a search', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderSearches({ onApply });
    await user.click(screen.getByRole('button', { name: 'Save search' }));
    await user.type(screen.getByLabelText('Search name'), 'My 7D');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('button', { name: 'My 7D' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'My 7D' }));
    expect(onApply).toHaveBeenCalledWith({ period: '7D' });
  });

  it('requires a name and deletes searches', async () => {
    const user = userEvent.setup();
    renderSearches();
    await user.click(screen.getByRole('button', { name: 'Save search' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Enter a name')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Search name'), 'Temp');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('button', { name: 'Temp' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete Temp' }));
    expect(screen.queryByRole('button', { name: 'Temp' })).not.toBeInTheDocument();
  });
});
