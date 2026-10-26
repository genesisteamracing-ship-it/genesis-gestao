"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-9 w-[76px] items-center justify-between rounded-full bg-[#E8E8E8] dark:bg-[#2A2B2F] p-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-2xs">
          <Sun className="h-4 w-4 text-black" />
        </div>
        <div className="flex h-7 w-7 items-center justify-center">
          <Moon className="h-4 w-4 text-black" />
        </div>
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Alternar tema claro e escuro"
      title={isDark ? "Alternar para tema claro" : "Alternar para tema escuro"}
      className="relative flex h-9 w-[76px] items-center rounded-full bg-[#E8E8E8] dark:bg-[#2A2B2F] p-1 transition-all duration-300 ease-out cursor-pointer hover:opacity-90 shadow-inner select-none"
    >
      {/* Indicador deslizante suave */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1 left-1 h-7 w-7 rounded-full bg-white dark:bg-[#1E2024] shadow-sm transition-transform duration-300 ease-spring",
          isDark ? "translate-x-[38px]" : "translate-x-0"
        )}
      />

      {/* Ícone Sol (Preto) */}
      <div className="relative z-10 flex h-7 w-7 items-center justify-center">
        <Sun className="h-4 w-4 text-black fill-black/10" />
      </div>

      {/* Ícone Lua (Preto) */}
      <div className="relative z-10 flex h-7 w-7 items-center justify-center">
        <Moon className="h-4 w-4 text-black fill-black/10" />
      </div>
    </button>
  );
}
