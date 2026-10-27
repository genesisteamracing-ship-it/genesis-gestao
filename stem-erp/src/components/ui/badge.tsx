import * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const badgeVariants = tv({
  base: "inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  variants: {
    variant: {
      default:
        "border-transparent bg-primary text-primary-foreground shadow-2xs hover:bg-primary/90",
      secondary:
        "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
      destructive:
        "border-transparent bg-destructive/15 text-destructive",
      outline:
        "border border-border text-foreground bg-card",
      success:
        "border-transparent bg-success/15 text-success",
      warning:
        "border-transparent bg-warning/18 text-warning",
      purple:
        "border-transparent bg-purple/15 text-purple",
      magenta:
        "border-transparent bg-magenta/15 text-magenta",
      emeraldSolid:
        "border-transparent bg-success text-success-foreground rounded-full px-3.5",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={badgeVariants({ variant, className })} {...props} />
  );
}

export { Badge };
