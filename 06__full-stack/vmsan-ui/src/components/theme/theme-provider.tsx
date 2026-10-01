"use client";

import * as React from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const defaultContextValue: ThemeContextValue = {
  theme: "system",
  resolvedTheme: "dark",
  setTheme: () => {},
};

const ThemeContext = React.createContext<ThemeContextValue>(defaultContextValue);

const THEME_STORAGE_KEY = "vmsan-theme";

const emptySubscribe = () => () => {};

function subscribeSystemTheme(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getSystemThemeSnapshot(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getSystemThemeServerSnapshot(): ResolvedTheme {
  return "dark";
}

export interface ThemeProviderProps {
  children?: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    try {
      const stored = localStorage.getItem(storageKey) as Theme | null;
      if (stored && (stored === "light" || stored === "dark" || stored === "system")) {
        return stored;
      }
    } catch {
      // localStorage may be unavailable or throw in private/sandboxed mode
    }
    return defaultTheme;
  });

  const isMounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const systemTheme = React.useSyncExternalStore(
    subscribeSystemTheme,
    getSystemThemeSnapshot,
    getSystemThemeServerSnapshot
  );

  const resolvedTheme: ResolvedTheme =
    theme === "system" ? systemTheme : (theme as ResolvedTheme);

  // Apply theme classes and attributes to documentElement whenever resolvedTheme changes
  React.useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
  }, [resolvedTheme]);

  const setTheme = React.useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem(storageKey, newTheme);
      } catch {
        // Safe fallback
      }
    },
    [storageKey]
  );

  const value = React.useMemo(
    () => ({
      theme,
      resolvedTheme: isMounted ? resolvedTheme : "dark",
      setTheme,
    }),
    [theme, resolvedTheme, isMounted, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return React.useContext(ThemeContext);
}

/**
 * Script injected into <head> to prevent FOUC (Flash of Unstyled Content) before hydration.
 */
export const themeInitScript = `
(function() {
  try {
    var key = '${THEME_STORAGE_KEY}';
    var theme = localStorage.getItem(key) || 'system';
    var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
})();
`;
