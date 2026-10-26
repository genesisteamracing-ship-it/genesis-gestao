import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#4880FF] text-white shadow-2xs hover:bg-[#3b6ee6]",
        secondary:
          "border-transparent bg-[#6226EF]/15 text-[#6226EF]",
        destructive:
          "border-transparent bg-[#EF3826]/15 text-[#EF3826]",
        outline:
          "border border-[#D5D5D5] text-[#202224] bg-white",
        success:
          "border-transparent bg-[#00B69B]/15 text-[#00B69B]",
        warning:
          "border-transparent bg-[#FFA756]/18 text-[#FFA756]",
        purple:
          "border-transparent bg-[#6226EF]/15 text-[#6226EF]",
        magenta:
          "border-transparent bg-[#BA29FF]/15 text-[#BA29FF]",
        emeraldSolid:
          "border-transparent bg-[#00B69B] text-white rounded-full px-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
