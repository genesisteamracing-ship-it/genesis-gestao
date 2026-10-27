import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { tv, type VariantProps } from "tailwind-variants";

export const labelVariants = tv({
  base: "text-xs font-semibold uppercase tracking-wide text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
});

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {}

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={labelVariants({ className })}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
