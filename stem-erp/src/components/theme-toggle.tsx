"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { tv } from "tailwind-variants";
import { useThemeToggle } from "@/components/layout/use-theme-toggle";

export const themeToggleStyles = tv({
  slots: {
    container:
      "relative flex h-9 w-[76px] items-center rounded-full bg-border p-1 transition-all duration-300 ease-out cursor-pointer hover:opacity-90 shadow-inner select-none",
    indicator:
      "absolute top-1 left-1 h-7 w-7 rounded-full bg-card shadow-sm transition-transform duration-300 ease-spring",
    iconSlot: "relative z-10 flex h-7 w-7 items-center justify-center",
  },
  variants: {
    isDark: {
      true: {
        indicator: "translate-x-[38px]",
      },
      false: {
        indicator: "translate-x-0",
      },
    },
  },
  defaultVariants: {
    isDark: false,
  },
});

export function ThemeToggle() {
  const { mounted, isDark, toggleTheme } = useThemeToggle();
  const styles = themeToggleStyles({ isDark });

  if (!mounted) {
    return (
      <div className="flex h-9 w-[76px] items-center justify-between rounded-full bg-border p-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-card shadow-2xs">
          <Sun className="h-4 w-4 text-foreground" />
        </div>
        <div className="flex h-7 w-7 items-center justify-center">
          <Moon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Alternar tema claro e escuro"
      title={isDark ? "Alternar para tema claro" : "Alternar para tema escuro"}
      className={styles.container()}
    >
      <span aria-hidden="true" className={styles.indicator()} />

      <div className={styles.iconSlot()}>
        <Sun className="h-4 w-4 text-foreground" />
      </div>

      <div className={styles.iconSlot()}>
        <Moon className="h-4 w-4 text-foreground" />
      </div>
    </button>
  );
}
