"use client";

import * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { BrazilFlagIcon, UsFlagIcon } from "./flag-icons";
import { useLocale } from "./locale-provider";

const languageSwitcherStyles = tv({
  slots: {
    root: "inline-flex items-center rounded-xl border border-border bg-muted/60 p-0.5 shadow-2xs",
    button:
      "inline-flex items-center justify-center rounded-lg font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
    flag: "shrink-0 rounded-[2px] shadow-2xs",
    code: "tracking-wide leading-none",
  },
  variants: {
    size: {
      sm: {
        button: "h-7 gap-1.5 px-2 text-[11px]",
        flag: "h-3.5 w-5",
      },
      md: {
        button: "h-8 gap-2 px-2.5 text-xs",
        flag: "h-4 w-6",
      },
    },
    showCode: {
      always: {
        code: "inline",
      },
      sm: {
        code: "hidden sm:inline",
      },
      never: {
        code: "sr-only",
      },
    },
    active: {
      true: {
        button: "bg-card text-foreground shadow-xs ring-1 ring-border",
      },
      false: {
        button:
          "text-muted-foreground hover:bg-card/60 hover:text-foreground",
      },
    },
  },
  defaultVariants: {
    size: "sm",
    showCode: "sm",
    active: false,
  },
});

export interface LanguageSwitcherProps
  extends Omit<VariantProps<typeof languageSwitcherStyles>, "active"> {
  className?: string;
}

export function LanguageSwitcher({
  size = "sm",
  showCode = "sm",
  className,
}: LanguageSwitcherProps) {
  const { locale, setLocale, isEnglish } = useLocale();
  const baseStyles = languageSwitcherStyles({ size, showCode });
  const ptButtonStyles = languageSwitcherStyles({
    size,
    showCode,
    active: locale === "pt-BR",
  });
  const enButtonStyles = languageSwitcherStyles({
    size,
    showCode,
    active: locale === "en-US",
  });

  return (
    <div
      data-no-translate="true"
      role="group"
      aria-label={isEnglish ? "Select language" : "Selecionar idioma"}
      className={baseStyles.root({ className })}
    >
      <button
        type="button"
        onClick={() => setLocale("pt-BR")}
        aria-label="Português (Brasil)"
        title="Português (Brasil)"
        aria-pressed={locale === "pt-BR"}
        className={ptButtonStyles.button()}
      >
        <BrazilFlagIcon className={baseStyles.flag()} />
        <span className={baseStyles.code()}>PT</span>
      </button>

      <button
        type="button"
        onClick={() => setLocale("en-US")}
        aria-label="English (United States)"
        title="English (United States)"
        aria-pressed={locale === "en-US"}
        className={enButtonStyles.button()}
      >
        <UsFlagIcon className={baseStyles.flag()} />
        <span className={baseStyles.code()}>EN</span>
      </button>
    </div>
  );
}
