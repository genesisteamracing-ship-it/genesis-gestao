"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { tv, type VariantProps } from "tailwind-variants";

export const passwordInputStyles = tv({
  slots: {
    root: "relative flex w-full items-center",
    startIconWrapper:
      "pointer-events-none absolute left-3.5 flex items-center justify-center text-muted-foreground/60",
    input:
      "flex h-9 w-full rounded-lg border border-input bg-card px-3 py-1 pr-10 text-sm text-foreground shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
    toggleButton:
      "absolute right-3.5 flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm cursor-pointer disabled:pointer-events-none disabled:opacity-50",
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
    hasStartIcon: {
      true: {
        input: "pl-10",
      },
      false: {
        input: "pl-3",
      },
    },
  },
  defaultVariants: {
    inputSize: "default",
    hasStartIcon: false,
  },
});

export interface PasswordInputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof passwordInputStyles> {
  startIcon?: React.ReactNode;
  toggleAriaLabel?: (isVisible: boolean) => string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      className,
      inputSize,
      startIcon,
      disabled,
      toggleAriaLabel,
      id,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(false);

    const { root, startIconWrapper, input, toggleButton } = passwordInputStyles({
      inputSize,
      hasStartIcon: Boolean(startIcon),
    });

    const toggleVisibility = () => {
      setIsVisible((prev) => !prev);
    };

    const label = toggleAriaLabel
      ? toggleAriaLabel(isVisible)
      : isVisible
      ? "Ocultar senha"
      : "Ver senha";

    return (
      <div className={root()}>
        {startIcon && (
          <div className={startIconWrapper()}>{startIcon}</div>
        )}
        <input
          ref={ref}
          id={id}
          type={isVisible ? "text" : "password"}
          disabled={disabled}
          className={input({
            className,
          })}
          {...props}
        />
        <button
          type="button"
          onClick={toggleVisibility}
          disabled={disabled}
          aria-label={label}
          title={label}
          className={toggleButton()}
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
