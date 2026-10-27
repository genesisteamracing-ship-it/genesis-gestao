import * as React from "react";
import { Award, Crown, Gem, Medal, Shield } from "lucide-react";
import { tv, type VariantProps } from "tailwind-variants";
import type { SponsorTier } from "@prisma/client";
import { SPONSOR_TIER_LABELS } from "@/lib/constants";

export const sponsorTierBadgeStyles = tv({
  base: "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors select-none",
  variants: {
    tier: {
      BRONZE:
        "border border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      SILVER:
        "border border-slate-400/40 bg-slate-400/15 text-slate-700 dark:text-slate-300",
      GOLD:
        "border border-yellow-500/40 bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
      DIAMOND:
        "border border-primary/40 bg-primary/15 text-primary shadow-2xs",
    },
    size: {
      sm: "px-2 py-0.5 text-[11px]",
      md: "px-2.5 py-1 text-xs",
      lg: "px-3 py-1.5 text-sm",
    },
  },
  defaultVariants: {
    tier: "BRONZE",
    size: "md",
  },
});

type SponsorTierBadgeVariants = VariantProps<typeof sponsorTierBadgeStyles>;

interface SponsorTierBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    SponsorTierBadgeVariants {
  tier: SponsorTier;
  showIcon?: boolean;
}

export function SponsorTierBadge({
  tier,
  size,
  showIcon = true,
  className,
  ...props
}: SponsorTierBadgeProps) {
  const Icon = React.useMemo(() => {
    switch (tier) {
      case "DIAMOND":
        return Gem;
      case "GOLD":
        return Crown;
      case "SILVER":
        return Award;
      case "BRONZE":
      default:
        return Medal;
    }
  }, [tier]);

  return (
    <span
      className={sponsorTierBadgeStyles({ tier, size, className })}
      {...props}
    >
      {showIcon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      <span>{SPONSOR_TIER_LABELS[tier]}</span>
    </span>
  );
}
