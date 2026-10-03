'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { shortAddress } from '@/lib/trader-format';
import { CheckIcon, CopyIcon } from 'lucide-react';

export interface CopyAddressProps {
  address: string;
  short?: boolean;
}

export function CopyAddress({ address, short = true }: CopyAddressProps) {
  const t = useTranslations('traders');
  const [copied, setCopied] = useState(false);

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — leave the button unchanged.
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span title={address} className="font-mono text-xs">
        {short ? shortAddress(address) : address}
      </span>
      <button
        type="button"
        aria-label={t('copyAddress')}
        title={t('copyAddress')}
        className="text-muted-foreground hover:text-foreground rounded p-0.5"
        onClick={handleCopy}
      >
        {copied ? (
          <CheckIcon className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <CopyIcon className="h-3.5 w-3.5" aria-hidden />
        )}
      </button>
      {copied && <span className="text-xs">{t('copied')}</span>}
    </span>
  );
}
