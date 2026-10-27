import * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const inputStyles = tv({
  base: "flex h-9 w-full rounded-lg border border-input bg-card px-3 py-1 text-sm text-foreground shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  variants: {
    inputSize: {
      default: "h-9",
      lg: "h-11 text-base",
    },
  },
  defaultVariants: {
    inputSize: "default",
  },
});

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputStyles> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputSize, ...props }, ref) => {
    return (
      <input
        type={type}
        className={inputStyles({ inputSize, className })}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
