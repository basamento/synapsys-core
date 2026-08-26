import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  /** What the operator chose, which may be "system". */
  theme: Theme;
  /** What that resolves to right now — the class actually on <html>. */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Both themes are of equal standing: a light "daylight" theme for desk use and
 * a dark one for night operations. Light is the default, and every token flips
 * off a single class on <html> — no component branches on the theme.
 */
export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "cortex-theme",
}: {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [theme, setThemeState] = useState<Theme>(
    () => (readStoredTheme(storageKey) ?? defaultTheme),
  );
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  // Only matters while the choice is "system", but the listener is cheap and
  // keeping it unconditional avoids a subscribe/unsubscribe on every toggle.
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) =>
      setSystemTheme(event.matches ? "dark" : "light");

    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [resolvedTheme]);

  const setTheme = useCallback(
    (next: Theme) => {
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // A console running with storage blocked still themes for the session.
      }
      setThemeState(next);
    },
    [storageKey],
  );

  // The toggle is two-state: it flips away from whatever is on screen, which
  // turns a stored "system" into an explicit choice.
  const toggleTheme = useCallback(
    () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
    [resolvedTheme, setTheme],
  );

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function readStoredTheme(storageKey: string): Theme | null {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored === "light" || stored === "dark" || stored === "system" ? stored : null;
  } catch {
    return null;
  }
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
