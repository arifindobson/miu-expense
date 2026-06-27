import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { THEMES, DEFAULT_THEME } from '../constants/themes';
import type { ThemeConfig } from '../types';

interface ThemeContextValue {
  themeKey: string;
  setThemeKey: (key: string) => void;
  t: ThemeConfig;
  THEMES: Record<string, ThemeConfig>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'miu_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey] = useState<string>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return saved && THEMES[saved] ? saved : DEFAULT_THEME;
  });

  // Persist the selection so it survives reloads
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, themeKey);
  }, [themeKey]);

  const t = THEMES[themeKey] || THEMES[DEFAULT_THEME];

  return (
    <ThemeContext.Provider value={{ themeKey, setThemeKey, t, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
