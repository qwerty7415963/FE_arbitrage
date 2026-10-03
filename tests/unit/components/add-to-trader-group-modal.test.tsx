import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { AddToTraderGroupModal } from '@/components/shared/traders/add-to-trader-group-modal';
import { addGroupMembers, createTraderGroup, listTraderGroups } from '@/services/traders';
import enMessages from '@/messages/en.json';

vi.mock('@/services/traders', () => ({
  listTraderGroups: vi.fn(),
  createTraderGroup: vi.fn(),
  addGroupMembers: vi.fn(),
}));

vi.mock('@/lib/stores/auth', () => ({
  useAuthStore: { getState: () => ({ requireAuth: () => true }) },
}));

const groups = [{ id: 'g1', user_id: 'u1', name: 'Main', description: null, member_count: 2 }];
const members = [
  { venue: 'hyperliquid', wallet_address: '0x1111111111111111111111111111111111111111' },
];

function renderModal(props: Partial<React.ComponentProps<typeof AddToTraderGroupModal>> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <AddToTraderGroupModal open onOpenChange={vi.fn()} members={members} {...props} />
    </NextIntlClientProvider>,
  );
}

describe('AddToTraderGroupModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(listTraderGroups).mockResolvedValue(groups);
  });

  it('lists groups and adds members on submit', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    vi.mocked(addGroupMembers).mockResolvedValue({ added: 1 });
    renderModal({ onSuccess });
    await screen.findByText('Main');
    await user.click(screen.getByRole('radio', { name: /Main/ }));
    await user.click(screen.getByRole('button', { name: 'Add 1' }));
    expect(addGroupMembers).toHaveBeenCalledWith('g1', members);
    expect(await screen.findByText('Added 1')).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalled();
  });

  it('requires a selected group', async () => {
    const user = userEvent.setup();
    renderModal();
    await screen.findByText('Main');
    await user.click(screen.getByRole('button', { name: 'Add 1' }));
    expect(await screen.findByText('Please choose a group')).toBeInTheDocument();
    expect(addGroupMembers).not.toHaveBeenCalled();
  });

  it('validates pasted addresses and normalizes them', async () => {
    const user = userEvent.setup();
    vi.mocked(addGroupMembers).mockResolvedValue({ added: 1 });
    renderModal({ members: [] });
    await screen.findByText('Main');
    await user.click(screen.getByRole('button', { name: 'Paste addresses' }));
    await user.type(
      screen.getByLabelText('Wallet addresses (one per line, comma or space separated)'),
      '0xABCDEF1234567890ABCDEF1234567890ABCDEF12 oops',
    );
    expect(screen.getByText('1 valid · 1 invalid')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /Main/ }));
    await user.click(screen.getByRole('button', { name: 'Add 1' }));
    expect(addGroupMembers).toHaveBeenCalledWith('g1', [
      { venue: 'hyperliquid', wallet_address: '0xabcdef1234567890abcdef1234567890abcdef12' },
    ]);
  });

  it('blocks over-long names and surfaces duplicates', async () => {
    const user = userEvent.setup();
    const { ApiError } = await import('@/infrastructure/api-client');
    renderModal();
    await screen.findByText('Main');
    await user.type(screen.getByPlaceholderText('e.g. Main watchlist'), 'x'.repeat(101));
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(
      await screen.findByText('Group name must be 100 characters or fewer'),
    ).toBeInTheDocument();
    expect(createTraderGroup).not.toHaveBeenCalled();

    await user.clear(screen.getByPlaceholderText('e.g. Main watchlist'));
    await user.type(screen.getByPlaceholderText('e.g. Main watchlist'), 'Main');
    vi.mocked(createTraderGroup).mockRejectedValue(new ApiError(409, 'GROUP-002', 'dup'));
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Group name already exists')).toBeInTheDocument();
  });

  it('reports zero additions for duplicate members', async () => {
    const user = userEvent.setup();
    vi.mocked(addGroupMembers).mockResolvedValue({ added: 0 });
    renderModal();
    await screen.findByText('Main');
    await user.click(screen.getByRole('radio', { name: /Main/ }));
    await user.click(screen.getByRole('button', { name: 'Add 1' }));
    expect(await screen.findByText('Added 0')).toBeInTheDocument();
  });
});
