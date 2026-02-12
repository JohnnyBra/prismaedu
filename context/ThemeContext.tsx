import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type ThemeMode = 'light' | 'dark';
type ThemePref = 'auto' | 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  preference: ThemePref;
  setPreference: (pref: ThemePref) => void;
  cycle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'sc_theme';

function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function readStoredPref(): ThemePref {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch {}
  return 'auto';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreferenceState] = useState<ThemePref>(readStoredPref);
  const [systemTheme, setSystemTheme] = useState<ThemeMode>(getSystemTheme);

  const resolvedTheme: ThemeMode = preference === 'auto' ? systemTheme : preference;

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'light' : 'dark');
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  const setPreference = useCallback((pref: ThemePref) => {
    setPreferenceState(pref);
    try {
      if (pref === 'auto') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, pref);
    } catch {}
  }, []);

  const cycle = useCallback(() => {
    setPreference(
      preference === 'auto' ? 'light' :
      preference === 'light' ? 'dark' : 'auto'
    );
  }, [preference, setPreference]);

  return (
    <ThemeContext.Provider value={{ theme: resolvedTheme, preference, setPreference, cycle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
