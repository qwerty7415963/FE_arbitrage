import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeState {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  theme: ResolvedTheme;
  resolved: ResolvedTheme;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  setTheme: (mode: ThemeMode) => void;
  toggle: () => void;
}

function systemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
}

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') return systemTheme();
  return mode;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      resolvedTheme: 'dark',
      theme: 'dark',
      resolved: 'dark',
      isDark: true,
      setMode: (mode) => {
        const resolved = resolveTheme(mode);
        set({
          mode,
          resolvedTheme: resolved,
          theme: resolved,
          resolved: resolved,
          isDark: resolved === 'dark',
        });
      },
      setTheme: (mode) => get().setMode(mode),
      toggle: () => {
        const current = get().resolvedTheme;
        get().setMode(current === 'dark' ? 'light' : 'dark');
      },
    }),
    {
      name: 'hyperscan.theme',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = resolveTheme(state.mode);
          state.resolvedTheme = resolved;
          state.theme = resolved;
          state.resolved = resolved;
          state.isDark = resolved === 'dark';
        }
      },
    },
  ),
);

if (typeof window !== 'undefined') {
  try {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const state = useThemeStore.getState();
      if (state.mode === 'system') {
        const resolved: ResolvedTheme = mql.matches ? 'dark' : 'light';
        useThemeStore.setState({
          resolvedTheme: resolved,
          theme: resolved,
          resolved: resolved,
          isDark: resolved === 'dark',
        });
      }
    };
    mql.addEventListener('change', handler);
  } catch {
    // ignore
  }
}
