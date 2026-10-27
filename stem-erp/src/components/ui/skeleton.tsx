import * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const skeletonStyles = tv({
  base: "animate-pulse rounded-md bg-muted",
  variants: {
    variant: {
      default: "bg-muted",
      card: "rounded-xl bg-muted/70",
      circle: "rounded-full bg-muted",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonStyles> {}

export function Skeleton({ className, variant, ...props }: SkeletonProps) {
  return (
    <div
      className={skeletonStyles({ variant, className })}
      aria-hidden="true"
      {...props}
    />
  );
}
