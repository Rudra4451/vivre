"use client";

import * as React from "react";

export type ThemeChoice = "system" | "night" | "atlas";
export type ResolvedTheme = "night" | "atlas";

interface ThemeContextValue {
  theme: ThemeChoice;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeChoice) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = "vivre-theme";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    mediaQuery.removeEventListener("change", callback);
  };
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: React.ReactNode;
  defaultTheme?: ThemeChoice;
}) {
  const [theme, setThemeState] = React.useState<ThemeChoice>(defaultTheme);

  // Subscribe to stored theme without set-state in effect
  const storedTheme = React.useSyncExternalStore(
    subscribe,
    () => (localStorage.getItem(THEME_STORAGE_KEY) as ThemeChoice) || defaultTheme,
    () => defaultTheme
  );

  const activeTheme = theme !== defaultTheme ? theme : storedTheme;

  // Subscribe to system prefers-color-scheme
  const prefersDark = React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => true
  );

  const resolvedTheme: ResolvedTheme =
    activeTheme === "system" ? (prefersDark ? "night" : "atlas") : activeTheme;

  // Synchronize DOM root classes directly
  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-night", "theme-atlas", "dark", "light");
    root.classList.add(resolvedTheme === "night" ? "theme-night" : "theme-atlas");
    if (resolvedTheme === "night") {
      root.classList.add("dark");
    }
  }, [resolvedTheme]);

  const setTheme = React.useCallback((newTheme: ThemeChoice) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      window.dispatchEvent(new Event("storage"));
    } catch {
      // Ignore quota/private mode errors
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
