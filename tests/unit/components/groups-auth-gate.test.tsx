import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Suspense, act } from 'react';
import { render, screen, waitFor, type RenderResult } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GroupsPage from '@/app/[locale]/(protected)/groups/page';
import GroupDetailPage from '@/app/[locale]/(protected)/groups/[groupId]/page';
import { getTraderGroup, listGroupMembers, listTraderGroups } from '@/services/traders';
import { getStatus } from '@/services/telegram';
import enMessages from '@/messages/en.json';

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  setConnectModalOpen: vi.fn(),
  requireAuth: vi.fn(() => true),
}));

vi.mock('@/services/traders', () => ({
  getTraderGroup: vi.fn(),
  listGroupMembers: vi.fn(),
  listTraderGroups: vi.fn(),
  createTraderGroup: vi.fn(),
  updateTraderGroup: vi.fn(),
  deleteTraderGroup: vi.fn(),
  removeGroupMembers: vi.fn(),
  updateGroupMembers: vi.fn(),
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
  const useAuthStore = (selector: (s: typeof authState) => unknown) => selector(authState);
  return { useAuthStore: Object.assign(useAuthStore, { getState: () => authState }) };
});
vi.mock('@/components/shared/auth/connect-wallet-button', () => ({
  ConnectWalletButton: () => <button type="button">Connect stub</button>,
}));

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

function renderTree(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="en" messages={enMessages}>
        {ui}
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

function renderList(): RenderResult {
  return renderTree(<GroupsPage />);
}

async function renderDetail(): Promise<RenderResult> {
  let tree!: RenderResult;
  await act(async () => {
    tree = renderTree(
      <Suspense fallback={<div>loading</div>}>
        <GroupDetailPage params={Promise.resolve({ groupId: 'g1' })} />
      </Suspense>,
    );
  });
  return tree;
}

describe('Groups auth gate', () => {
  beforeEach(() => {
    authState.isAuthenticated = false;
    vi.mocked(getTraderGroup).mockReset();
    vi.mocked(listGroupMembers).mockReset();
    vi.mocked(listTraderGroups).mockReset();
    vi.mocked(getStatus).mockReset();
    vi.mocked(getStatus).mockResolvedValue({
      connected: false,
      tg_username: null,
      locale: 'en',
      status: 'disconnected',
      groups_enabled: 0,
    } as never);
  });

  it('groups list skips the API while unauthenticated and shows the connect CTA', async () => {
    renderList();

    expect(screen.getByRole('heading', { name: 'Groups' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Connect stub' })).toBeInTheDocument();
    expect(listTraderGroups).not.toHaveBeenCalled();
    expect(getStatus).not.toHaveBeenCalled();
  });

  it('groups list fetches once authentication becomes available', async () => {
    vi.mocked(listTraderGroups).mockResolvedValue(groups as unknown as never);
    const tree = renderList();

    await screen.findByRole('button', { name: 'Connect stub' });
    expect(listTraderGroups).not.toHaveBeenCalled();

    authState.isAuthenticated = true;
    tree.rerender(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <GroupsPage />
        </NextIntlClientProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(listTraderGroups).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Main')).toBeInTheDocument();
  });

  it('group detail skips both group and member requests while unauthenticated', async () => {
    await renderDetail();

    expect(await screen.findByRole('heading', { name: 'Groups' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Connect stub' })).toBeInTheDocument();
    expect(getTraderGroup).not.toHaveBeenCalled();
    expect(listGroupMembers).not.toHaveBeenCalled();
    expect(getStatus).not.toHaveBeenCalled();
  });
});
