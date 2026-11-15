import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AssetIcon } from '@/components/shared/asset-icon';

describe('AssetIcon', () => {
  it('renders img when logoUrl provided', () => {
    render(<AssetIcon symbol="BTC" logoUrl="https://example.com/btc.png" size={16} />);
    const img = screen.getByRole('img', { name: 'BTC' }) as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe('https://example.com/btc.png');
  });

  it('falls back on image error', () => {
    const { container } = render(
      <AssetIcon symbol="BTC" logoUrl="https://example.com/bad.png" size={16} />,
    );
    const img = screen.getByRole('img', { name: 'BTC' }) as HTMLImageElement;
    fireEvent.error(img);
    expect(container.querySelector('span')).toBeInTheDocument();
  });

  it('renders category icon for index', () => {
    const { container } = render(<AssetIcon symbol="SP500" category="index" size={16} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders initials badge for unknown', () => {
    const { container } = render(<AssetIcon symbol="ZZZ" size={16} />);
    expect(container.querySelector('span')).toBeInTheDocument();
    expect(container.textContent).toContain('ZZ');
  });

  it('renders nothing for empty symbol without category', () => {
    const { container } = render(<AssetIcon symbol="" size={16} />);
    expect(container.firstChild).toBeNull();
  });
});
