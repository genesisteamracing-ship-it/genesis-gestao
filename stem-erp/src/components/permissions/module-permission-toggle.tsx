"use client";

import * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { Loader2 } from "lucide-react";

export const modulePermissionToggleStyles = tv({
  slots: {
    root: "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card p-0.5 text-xs font-semibold shadow-2xs transition-colors",
    pillYes:
      "flex h-7 items-center justify-center rounded-md px-2.5 text-[11px] font-bold transition-all cursor-pointer select-none",
    pillNo:
      "flex h-7 items-center justify-center rounded-md px-2.5 text-[11px] font-bold transition-all cursor-pointer select-none",
  },
  variants: {
    allowed: {
      true: {
        pillYes: "bg-success text-primary-foreground shadow-xs",
        pillNo: "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
      },
      false: {
        pillYes: "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
        pillNo: "bg-destructive/15 text-destructive font-extrabold shadow-xs",
      },
    },
    disabled: {
      true: {
        root: "opacity-50 pointer-events-none cursor-not-allowed",
        pillYes: "cursor-not-allowed",
        pillNo: "cursor-not-allowed",
      },
    },
  },
  defaultVariants: {
    allowed: true,
    disabled: false,
  },
});

export type ModulePermissionToggleVariants = VariantProps<
  typeof modulePermissionToggleStyles
>;

export interface ModulePermissionToggleProps {
  moduleLabel: string;
  userName: string;
  allowed: boolean;
  disabled?: boolean;
  disabledReason?: string;
  isLoading?: boolean;
  onToggle: (nextAllowed: boolean) => void;
  className?: string;
}

export function ModulePermissionToggle({
  moduleLabel,
  userName,
  allowed,
  disabled = false,
  disabledReason,
  isLoading = false,
  onToggle,
  className,
}: ModulePermissionToggleProps) {
  const styles = modulePermissionToggleStyles({
    allowed,
    disabled: disabled || isLoading,
  });

  const handleToggle = (targetState: boolean) => {
    if (disabled || isLoading || allowed === targetState) return;
    onToggle(targetState);
  };

  return (
    <div
      role="group"
      aria-label={`Acesso ao módulo ${moduleLabel} para ${userName}: ${allowed ? "SIM" : "NÃO"}`}
      title={disabled && disabledReason ? disabledReason : undefined}
      className={styles.root({ className })}
    >
      <button
        type="button"
        role="radio"
        aria-checked={allowed}
        disabled={disabled || isLoading}
        onClick={() => handleToggle(true)}
        className={styles.pillYes()}
        title={disabled && disabledReason ? disabledReason : `Conceder acesso (SIM) para ${moduleLabel}`}
      >
        {isLoading && allowed ? (
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
        ) : null}
        SIM
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={!allowed}
        disabled={disabled || isLoading}
        onClick={() => handleToggle(false)}
        className={styles.pillNo()}
        title={disabled && disabledReason ? disabledReason : `Bloquear acesso (NÃO) para ${moduleLabel}`}
      >
        {isLoading && !allowed ? (
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
        ) : null}
        NÃO
      </button>
    </div>
  );
}
