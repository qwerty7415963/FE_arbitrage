import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SettingsPage from '@/app/[locale]/(protected)/settings/page';
import { getStatus, createLink, unlink } from '@/services/telegram';
import { ApiError } from '@/infrastructure/api-client';
import { useAuthStore } from '@/lib/stores/auth';
import enMessages from '@/messages/en.json';

vi.mock('@/services/telegram', () => ({
  getStatus: vi.fn(),
  createLink: vi.fn(),
  unlink: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/en/settings',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  return {
    ...actual,
    useLocale: () => 'en',
  };
});

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

describe('SettingsPage telegram', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ isAuthenticated: true, connectModalOpen: false });
  });

  it('shows connect button when not connected', async () => {
    vi.mocked(getStatus).mockResolvedValue({
      connected: false,
      tg_username: null,
      locale: 'vi',
      status: 'disconnected',
      groups_enabled: 0,
    });
    render(wrapper(<SettingsPage />));
    expect(await screen.findByRole('button', { name: /Connect Telegram/i })).toBeInTheDocument();
  });

  it('connect modal shows deep link + code + copy', async () => {
    vi.mocked(getStatus).mockResolvedValue({
      connected: false,
      tg_username: null,
      locale: 'vi',
      status: 'disconnected',
      groups_enabled: 0,
    });
    vi.mocked(createLink).mockResolvedValue({
      code: 'CODE123',
      deep_link: 'https://t.me/bot?start=CODE123',
      expires_at: '2026-01-01T00:10:00Z',
    });
    const user = userEvent.setup();
    render(wrapper(<SettingsPage />));
    await user.click(await screen.findByRole('button', { name: /Connect Telegram/i }));
    expect(await screen.findByText('CODE123')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy/i })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Open in Telegram/i }) ??
        screen.getByRole('button', { name: /Open in Telegram/i }),
    ).toBeInTheDocument();
  });

  it('shows connected UI with username', async () => {
    vi.mocked(getStatus).mockResolvedValue({
      connected: true,
      tg_username: 'johndoe',
      locale: 'en',
      status: 'active',
      groups_enabled: 3,
    });
    render(wrapper(<SettingsPage />));
    expect(await screen.findByText(/Connected as @johndoe/i)).toBeInTheDocument();
    expect(screen.getByText(/Enabled groups: 3/i)).toBeInTheDocument();
  });

  it('disconnect with confirmation', async () => {
    vi.mocked(getStatus).mockResolvedValue({
      connected: true,
      tg_username: 'johndoe',
      locale: 'en',
      status: 'active',
      groups_enabled: 3,
    });
    vi.mocked(unlink).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(wrapper(<SettingsPage />));
    await user.click(await screen.findByRole('button', { name: /Disconnect/i }));
    await screen.findByText(/Disconnect Telegram\?/i);
    const buttons = screen.getAllByRole('button', { name: /Disconnect/i });
    await user.click(buttons[buttons.length - 1]);
    await waitFor(() => expect(unlink).toHaveBeenCalled());
  });

  it('shows wallet CTA and skips the status query when unauthenticated', async () => {
    useAuthStore.setState({ isAuthenticated: false });

    render(wrapper(<SettingsPage />));

    expect(
      await screen.findByText(/Connect your wallet to manage Telegram notifications/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Connect Wallet/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Retry/i })).not.toBeInTheDocument();
    expect(getStatus).not.toHaveBeenCalled();
  });

  it('shows session expired copy with reconnect CTA on 401', async () => {
    vi.mocked(getStatus).mockRejectedValue(new ApiError(401, 'AUTH-003', 'Session expired'));

    render(wrapper(<SettingsPage />));

    expect(await screen.findByText(/session has expired/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reconnect wallet/i })).toBeInTheDocument();
    expect(getStatus).toHaveBeenCalledTimes(1);
  });

  it('shows generic error with retry for non-auth failures', async () => {
    vi.mocked(getStatus).mockRejectedValue(new ApiError(500, 'INTERNAL', 'boom'));

    render(wrapper(<SettingsPage />));

    expect(await screen.findByText(/Failed to load Telegram status/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });
});
