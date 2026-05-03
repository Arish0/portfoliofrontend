import { useEffect, useState } from 'react';
import type { PortfolioTheme } from '../../../types/portfolio';
import { readStoredTheme, THEME_STORAGE_KEY } from '../../../utils/portfolio';

export const usePortfolioTheme = (): {
  theme: PortfolioTheme;
  setTheme: (nextTheme: PortfolioTheme) => void;
} => {
  const [theme, setThemeState] = useState<PortfolioTheme>(readStoredTheme);

  const setTheme = (nextTheme: PortfolioTheme): void => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Ignore storage failures and still apply the theme for this page load.
    }
    setThemeState(nextTheme);
  };

  useEffect((): void => {
    document.documentElement.dataset.portfolioTheme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Theme persistence is a convenience; the UI still works without storage.
    }
  }, [theme]);

  return { theme, setTheme };
};
