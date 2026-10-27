import * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const textareaStyles = tv({
  base: "flex min-h-[80px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
});

export interface TextareaProps
  extends React.ComponentProps<"textarea">,
    VariantProps<typeof textareaStyles> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={textareaStyles({ className })}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
