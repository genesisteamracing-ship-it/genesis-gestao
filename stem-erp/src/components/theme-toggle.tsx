"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { tv } from "tailwind-variants";
import { useThemeToggle } from "@/components/layout/use-theme-toggle";

export const themeToggleStyles = tv({
  slots: {
    container:
      "relative flex h-9 w-[84px] items-center justify-between rounded-full bg-[#E8E8E8] dark:bg-[#2F3238] p-1 transition-all duration-300 ease-out cursor-pointer hover:opacity-95 shadow-inner select-none",
    indicator:
      "absolute top-1 left-1 h-7 w-7 rounded-full bg-white shadow-sm transition-transform duration-300 ease-spring pointer-events-none",
    iconSlot: "relative z-10 flex h-7 w-7 items-center justify-center",
  },
  variants: {
    isDark: {
      true: {
        indicator: "translate-x-[48px]",
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
      <div className="flex h-9 w-[84px] items-center justify-between rounded-full bg-[#E8E8E8] dark:bg-[#2F3238] p-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-xs">
          <Sun className="h-4 w-4 text-black stroke-[2.2]" />
        </div>
        <div className="flex h-7 w-7 items-center justify-center">
          <Moon className="h-4 w-4 text-black stroke-[2.2]" />
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
      {/* Indicador circular deslizante sempre branco */}
      <span aria-hidden="true" className={styles.indicator()} />

      {/* Ícone Sol (Preto) na extrema esquerda */}
      <div className={styles.iconSlot()}>
        <Sun className="h-4 w-4 text-black stroke-[2.2]" />
      </div>

      {/* Ícone Lua (Preto) na extrema direita e mais distante */}
      <div className={styles.iconSlot()}>
        <Moon className="h-4 w-4 text-black stroke-[2.2]" />
      </div>
    </button>
  );
}
