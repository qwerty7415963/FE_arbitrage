'use client';

import { useLayoutEffect as useEffect } from 'react';
import { useThemeStore } from '@/lib/stores/theme';

export function ThemeSync() {
  useEffect(() => {
    const apply = (mode: 'light' | 'dark' | 'system') => {
      const resolved =
        mode === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : mode;
      document.documentElement.classList.toggle('dark', resolved === 'dark');
      document.documentElement.style.colorScheme = resolved;
    };

    apply(useThemeStore.getState().mode);

    const unsubscribe = useThemeStore.subscribe((state) => apply(state.mode));

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = () => {
      if (useThemeStore.getState().mode === 'system') apply('system');
    };
    mql.addEventListener('change', onSystemChange);

    return () => {
      unsubscribe();
      mql.removeEventListener('change', onSystemChange);
    };
  }, []);

  return null;
}
