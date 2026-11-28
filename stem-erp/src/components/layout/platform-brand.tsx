import * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { PLATFORM_NAME } from "@/lib/constants";

export const platformBrandStyles = tv({
  base: "inline-flex items-center tracking-tight text-primary",
  variants: {
    size: {
      sm: "text-base sm:text-lg font-extrabold",
      md: "text-lg font-extrabold",
      lg: "text-xl font-extrabold",
      login: "text-xl font-black",
    },
  },
  defaultVariants: {
    size: "lg",
  },
});

export interface PlatformBrandProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof platformBrandStyles> {}

export function PlatformBrand({
  size,
  className,
  ...props
}: PlatformBrandProps) {
  return (
    <span className={platformBrandStyles({ size, className })} {...props}>
      {PLATFORM_NAME}
    </span>
  );
}
