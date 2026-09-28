import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { GroupForm } from '@/app/[locale]/(protected)/groups/_components/group-form';
import * as groupsService from '@/services/groups';
import { ApiError } from '@/infrastructure/api-client';
import enMessages from '@/messages/en.json';

vi.mock('@/services/groups', () => ({
  createGroup: vi.fn(),
  updateGroup: vi.fn(),
}));

const mockGroup = {
  id: 'g1',
  name: 'Main',
  description: 'desc',
  color: '#fff',
  wallet_count: 2,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

function renderForm(props: Partial<React.ComponentProps<typeof GroupForm>> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <GroupForm open onOpenChange={() => {}} onSuccess={() => {}} {...props} />
    </NextIntlClientProvider>,
  );
}

describe('GroupForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders create title when no group', () => {
    renderForm();
    expect(screen.getByText('Create group')).toBeInTheDocument();
  });

  it('renders edit title when group provided', () => {
    renderForm({ group: mockGroup });
    expect(screen.getByText('Edit group')).toBeInTheDocument();
  });

  it('blocks submit with blank name without calling API', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(screen.getByText('Group name is required')).toBeInTheDocument();
    });
    expect(groupsService.createGroup).not.toHaveBeenCalled();
  });

  it('shows duplicate error on GROUP-002', async () => {
    vi.mocked(groupsService.createGroup).mockRejectedValue(
      new ApiError(409, 'GROUP-002', 'duplicate'),
    );
    renderForm();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Main' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(screen.getByText('Group name already exists')).toBeInTheDocument();
    });
  });

  it('calls onSuccess and closes on create success', async () => {
    const onSuccess = vi.fn();
    const onOpenChange = vi.fn();
    vi.mocked(groupsService.createGroup).mockResolvedValue(mockGroup);
    renderForm({ onSuccess, onOpenChange });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Main' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockGroup);
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
