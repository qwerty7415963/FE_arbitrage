import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { GroupForm } from '@/app/[locale]/(protected)/groups/_components/group-form';
import * as tradersService from '@/services/traders';
import { useAuthStore } from '@/lib/stores/auth';
import { ApiError } from '@/infrastructure/api-client';
import enMessages from '@/messages/en.json';

vi.mock('@/services/traders', () => ({
  createTraderGroup: vi.fn(),
  updateTraderGroup: vi.fn(),
}));

const mockGroup = {
  id: 'g1',
  user_id: 'u1',
  name: 'Main',
  description: 'desc',
  member_count: 2,
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
    useAuthStore.setState({ isAuthenticated: true, connectModalOpen: false });
  });

  it('renders create title when no group', () => {
    renderForm();
    expect(screen.getByText('Create group')).toBeInTheDocument();
    expect(screen.queryByLabelText('Color')).not.toBeInTheDocument();
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
    expect(tradersService.createTraderGroup).not.toHaveBeenCalled();
  });

  it('blocks names longer than 100 characters', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'x'.repeat(101) } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(screen.getByText('Group name must be 100 characters or fewer')).toBeInTheDocument();
    });
    expect(tradersService.createTraderGroup).not.toHaveBeenCalled();
  });

  it('shows duplicate error on GROUP-002', async () => {
    vi.mocked(tradersService.createTraderGroup).mockRejectedValue(
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
    vi.mocked(tradersService.createTraderGroup).mockResolvedValue(mockGroup);
    renderForm({ onSuccess, onOpenChange });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Main' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockGroup);
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('opens connect modal instead of submitting when unauthenticated', async () => {
    useAuthStore.setState({ isAuthenticated: false, connectModalOpen: false });
    renderForm();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Main' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(useAuthStore.getState().connectModalOpen).toBe(true);
    });
    expect(tradersService.createTraderGroup).not.toHaveBeenCalled();
  });
});
