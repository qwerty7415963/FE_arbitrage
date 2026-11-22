import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/messages/en.json';

const mockReplace = vi.fn();

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/traders',
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('foo=bar'),
}));

vi.mock('@/lib/stores/auth', () => ({
  useAuthStore: (selector: (state: { isAuthenticated: boolean }) => unknown) =>
    selector({ isAuthenticated: false }),
}));

vi.mock('@/infrastructure/api-client', () => ({
  apiClient: vi.fn(),
}));

import { LanguageSwitcher } from '@/components/shared/language-switcher';

afterEach(() => cleanup());

describe('LanguageSwitcher', () => {
  it('switches locale and preserves query params', async () => {
    const user = userEvent.setup();
    render(
      <NextIntlClientProvider locale="vi" messages={enMessages}>
        <LanguageSwitcher />
      </NextIntlClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Language' }));
    await user.click(await screen.findByText('English'));

    expect(mockReplace).toHaveBeenCalledWith('/traders?foo=bar', { locale: 'en' });
    expect(document.cookie).toContain('NEXT_LOCALE=en');
  });
});
