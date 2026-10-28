"use client";

import * as React from "react";
import { useTheme } from "next-themes";

export function useThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const isDark = resolvedTheme === "dark";

  const toggleTheme = React.useCallback(() => {
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  return {
    mounted,
    isDark,
    toggleTheme,
  };
}
