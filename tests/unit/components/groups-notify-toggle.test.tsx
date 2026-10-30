import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GroupsPage from '@/app/[locale]/(protected)/groups/page';
import { listTraderGroups, updateTraderGroup } from '@/services/traders';
import { getStatus } from '@/services/telegram';
import enMessages from '@/messages/en.json';

vi.mock('@/services/traders', () => ({
  listTraderGroups: vi.fn(),
  updateTraderGroup: vi.fn(),
  createTraderGroup: vi.fn(),
  deleteTraderGroup: vi.fn(),
}));
vi.mock('@/services/telegram', () => ({
  getStatus: vi.fn(),
  createLink: vi.fn(),
  unlink: vi.fn(),
}));
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('@/lib/stores/auth', () => {
  const state = {
    isAuthenticated: true,
    setConnectModalOpen: vi.fn(),
    requireAuth: () => true,
  };
  const useAuthStore = (selector: (s: typeof state) => unknown) => selector(state);
  return { useAuthStore: Object.assign(useAuthStore, { getState: () => state }) };
});
vi.mock('@/components/shared/auth/connect-wallet-button', () => ({
  ConnectWalletButton: () => <button type="button">Connect stub</button>,
}));

function wrapper(children: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="en" messages={enMessages}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

const groups = [
  {
    id: 'g1',
    user_id: 'u1',
    name: 'Main',
    description: null,
    member_count: 2,
    notify_enabled: false,
  },
];

describe('GroupsPage notify toggle', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(listTraderGroups).mockResolvedValue(groups as unknown as never);
  });

  it('switch disabled with hint when telegram not connected', async () => {
    vi.mocked(getStatus).mockResolvedValue({
      connected: false,
      tg_username: null,
      locale: 'vi',
      status: 'disconnected',
      groups_enabled: 0,
    });
    render(wrapper(<GroupsPage />));
    const sw = await screen.findByRole('switch');
    expect(sw).toBeDisabled();
    expect(screen.getByText(/Connect Telegram to enable notifications/i)).toBeInTheDocument();
  });

  it('switch PATCHes notify_enabled when connected', async () => {
    vi.mocked(getStatus).mockResolvedValue({
      connected: true,
      tg_username: 'u',
      locale: 'en',
      status: 'active',
      groups_enabled: 1,
    });
    vi.mocked(updateTraderGroup).mockResolvedValue({
      ...groups[0],
      notify_enabled: true,
    } as unknown as never);
    const user = userEvent.setup();
    render(wrapper(<GroupsPage />));
    const sw = await screen.findByRole('switch');
    await user.click(sw);
    await waitFor(() =>
      expect(updateTraderGroup).toHaveBeenCalledWith('g1', { notify_enabled: true }),
    );
  });
});
