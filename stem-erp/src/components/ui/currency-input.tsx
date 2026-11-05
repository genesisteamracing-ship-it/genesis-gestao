"use client";

import * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { formatCurrencyMask } from "@/lib/utils";

export const currencyInputStyles = tv({
  slots: {
    root: "relative flex w-full items-center",
    prefix:
      "pointer-events-none absolute left-3 flex items-center justify-center text-xs font-semibold text-muted-foreground select-none",
    input:
      "flex h-9 w-full rounded-lg border border-input bg-card px-3 py-1 text-sm text-foreground shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  },
  variants: {
    inputSize: {
      default: {
        input: "h-9",
      },
      lg: {
        input: "h-11 text-base",
      },
    },
    hasPrefix: {
      true: {
        input: "pl-9",
      },
      false: {
        input: "pl-3",
      },
    },
  },
  defaultVariants: {
    inputSize: "default",
    hasPrefix: false,
  },
});

export interface CurrencyInputProps
  extends Omit<React.ComponentProps<"input">, "size" | "value" | "defaultValue">,
    VariantProps<typeof currencyInputStyles> {
  value?: string | number;
  defaultValue?: string | number;
  onValueChange?: (value: string) => void;
  prefixText?: string;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      className,
      inputSize,
      prefixText,
      value,
      defaultValue,
      onChange,
      onValueChange,
      onFocus,
      placeholder = "0,00",
      ...props
    },
    ref
  ) => {
    const innerRef = React.useRef<HTMLInputElement | null>(null);

    // Mescla ref externa com ref interna para controle de cursor
    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    const { root, prefix, input } = currencyInputStyles({
      inputSize,
      hasPrefix: Boolean(prefixText),
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const masked = formatCurrencyMask(rawValue);

      // Atualiza o valor no evento para manter compatibilidade com React Hook Form
      e.target.value = masked;
      onChange?.(e);
      onValueChange?.(masked);

      // Em máscaras ATM o cursor deve permanecer no final dos centavos digitados
      requestAnimationFrame(() => {
        if (innerRef.current) {
          const len = masked.length;
          innerRef.current.setSelectionRange(len, len);
        }
      });
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      onFocus?.(e);
      if (e.target.value) {
        const len = e.target.value.length;
        requestAnimationFrame(() => {
          innerRef.current?.setSelectionRange(len, len);
        });
      }
    };

    return (
      <div className={root()}>
        {prefixText && <span className={prefix()}>{prefixText}</span>}
        <input
          ref={innerRef}
          type="text"
          inputMode="numeric"
          value={value !== undefined ? formatCurrencyMask(value) : undefined}
          defaultValue={
            defaultValue !== undefined ? formatCurrencyMask(defaultValue) : undefined
          }
          placeholder={placeholder}
          onChange={handleChange}
          onFocus={handleFocus}
          className={input({ className })}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
