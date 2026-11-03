"use client";

import { tv, type VariantProps } from "tailwind-variants";
import { MessageSquare, Sparkles } from "lucide-react";
import { COMMUNICATION_CHANNEL_LABELS } from "@/lib/communication-constants";
import type { HierarchyTier, OrgMapActionCardDTO } from "@/types/communication";

const planCardStyles = tv({
  slots: {
    wrapper: "w-[220px] sm:w-[236px] rounded-xl border bg-card/90 p-2.5 text-left shadow-2xs transition-colors hover:bg-accent/50",
    statusRow: "flex items-center justify-between gap-1.5 text-[10px] font-medium",
    title: "mt-1 line-clamp-2 text-[11px] sm:text-xs font-semibold text-foreground leading-snug",
    progressTrack: "mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary",
    progressFill: "h-full rounded-full transition-all duration-300",
  },
  variants: {
    tier: {
      TIER_1_STRATEGIC: {
        wrapper: "border-purple/35",
        statusRow: "text-purple",
        progressFill: "bg-purple",
      },
      TIER_2_INSTITUTIONAL: {
        wrapper: "border-primary/35",
        statusRow: "text-primary",
        progressFill: "bg-primary",
      },
      TIER_3_TACTICAL: {
        wrapper: "border-success/35",
        statusRow: "text-success",
        progressFill: "bg-success",
      },
      TIER_4_OPERATIONAL: {
        wrapper: "border-warning/35",
        statusRow: "text-warning",
        progressFill: "bg-warning",
      },
    },
  },
  defaultVariants: {
    tier: "TIER_2_INSTITUTIONAL",
  },
});

export type OrgMapPlanCardVariants = VariantProps<typeof planCardStyles>;

interface OrgMapPlanCardProps {
  card: OrgMapActionCardDTO;
  tier: HierarchyTier;
  onClick?: () => void;
}

export function OrgMapPlanCard({ card, tier, onClick }: OrgMapPlanCardProps) {
  const styles = planCardStyles({ tier });

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.wrapper()} cursor-pointer`}
      aria-label={`Plano de comunicação: ${card.title}`}
    >
      <div className={styles.statusRow()}>
        <span className="inline-flex items-center gap-1 truncate">
          <Sparkles className="h-2.5 w-2.5 shrink-0" />
          {card.statusLabel}
        </span>
        <span className="inline-flex items-center gap-0.5 text-muted-foreground shrink-0">
          <MessageSquare className="h-2.5 w-2.5" />
          {COMMUNICATION_CHANNEL_LABELS[card.channel].split(" ")[0]}
        </span>
      </div>

      <p className={styles.title()}>{card.title}</p>

      <div className={styles.progressTrack()}>
        <div
          className={styles.progressFill()}
          style={{ width: `${card.progressPercent}%` }}
        />
      </div>
    </button>
  );
}
