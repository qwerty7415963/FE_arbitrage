import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { CopyAddress } from '@/components/shared/traders/copy-address';
import enMessages from '@/messages/en.json';

const ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

function renderCopy(props: Partial<React.ComponentProps<typeof CopyAddress>> = {}) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <CopyAddress address={ADDRESS} {...props} />
    </NextIntlClientProvider>,
  );
}

describe('CopyAddress', () => {
  it('shortens by default and copies the full address', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...globalThis.navigator, clipboard: { writeText } });
    try {
      renderCopy();
      expect(screen.getByText('0x1234...5678')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Copy address' }));
      expect(writeText).toHaveBeenCalledWith(ADDRESS);
      expect(await screen.findByText('Copied')).toBeInTheDocument();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('shows the full address when short is false', () => {
    renderCopy({ short: false });
    expect(screen.getByText(ADDRESS)).toBeInTheDocument();
  });
});
