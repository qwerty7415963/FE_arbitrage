'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/lib/stores/theme';

const OPTIONS = [
  { mode: 'light' as const, icon: Sun, key: 'light' },
  { mode: 'dark' as const, icon: Moon, key: 'dark' },
  { mode: 'system' as const, icon: Monitor, key: 'system' },
];

export function ThemeToggle() {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const t = useTranslations('theme');

  return (
    <div role="group" aria-label={t('toggle')} className="inline-flex items-center gap-1">
      {OPTIONS.map(({ mode: optionMode, icon: Icon, key }) => (
        <Button
          key={optionMode}
          type="button"
          variant={mode === optionMode ? 'secondary' : 'ghost'}
          size="sm"
          aria-pressed={mode === optionMode}
          aria-label={t(key)}
          onClick={() => setMode(optionMode)}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}
