"use client";

import { tv } from "tailwind-variants";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STAKEHOLDER_INTEREST_LABELS,
  STAKEHOLDER_POWER_LABELS,
} from "@/lib/communication-constants";
import { resolveStakeholderMatrixQuadrant } from "@/lib/communication-hierarchy";
import type {
  StakeholderInterest,
  StakeholderPower,
} from "@/types/communication";

const quadrantFieldsStyles = tv({
  slots: {
    container: "rounded-xl border border-border bg-muted/40 p-3 space-y-2.5",
    header: "flex flex-wrap items-center justify-between gap-2",
    title: "text-xs font-bold text-foreground",
    grid: "grid grid-cols-1 sm:grid-cols-3 gap-3",
    fieldCol: "flex flex-col justify-between space-y-1.5",
    label: "text-xs font-semibold leading-tight min-h-[2rem] flex items-end",
    controlWrap: "mt-auto",
  },
});

const quadrantBadgeStyles = tv({
  base: "text-[11px] font-semibold",
  variants: {
    tone: {
      destructive: "border-destructive/30 bg-destructive/10 text-destructive",
      success: "border-success/30 bg-success/10 text-success",
      primary: "border-primary/30 bg-primary/10 text-primary",
      warning: "border-warning/30 bg-warning/10 text-warning",
    },
  },
});

interface StakeholderQuadrantFieldsProps {
  power: StakeholderPower;
  interest: StakeholderInterest;
  parentStakeholderId: string | null | undefined;
  parentOptions: Array<{ id: string; name: string }>;
  onPowerChange: (value: StakeholderPower) => void;
  onInterestChange: (value: StakeholderInterest) => void;
  onParentChange: (value: string | null) => void;
}

export function StakeholderQuadrantFields({
  power,
  interest,
  parentStakeholderId,
  parentOptions,
  onPowerChange,
  onInterestChange,
  onParentChange,
}: StakeholderQuadrantFieldsProps) {
  const styles = quadrantFieldsStyles();
  const quadrantInfo = resolveStakeholderMatrixQuadrant(power, interest);

  return (
    <div className={styles.container()}>
      <div className={styles.header()}>
        <span className={styles.title()}>Matriz Poder × Interesse</span>
        <Badge
          variant="outline"
          className={quadrantBadgeStyles({ tone: quadrantInfo.tone })}
        >
          Quadrante: {quadrantInfo.label}
        </Badge>
      </div>

      <div className={styles.grid()}>
        <div className={styles.fieldCol()}>
          <Label htmlFor="stakeholder-power" className={styles.label()}>
            Poder sobre o Projeto
          </Label>
          <div className={styles.controlWrap()}>
            <Select
              value={power}
              onValueChange={(value) => onPowerChange(value as StakeholderPower)}
            >
              <SelectTrigger
                id="stakeholder-power"
                className="w-full text-xs bg-card"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STAKEHOLDER_POWER_LABELS) as StakeholderPower[]).map(
                  (p) => (
                    <SelectItem key={p} value={p} className="text-xs">
                      {STAKEHOLDER_POWER_LABELS[p]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={styles.fieldCol()}>
          <Label htmlFor="stakeholder-interest" className={styles.label()}>
            Nível de Interesse
          </Label>
          <div className={styles.controlWrap()}>
            <Select
              value={interest}
              onValueChange={(value) =>
                onInterestChange(value as StakeholderInterest)
              }
            >
              <SelectTrigger
                id="stakeholder-interest"
                className="w-full text-xs bg-card"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.keys(
                    STAKEHOLDER_INTEREST_LABELS
                  ) as StakeholderInterest[]
                ).map((i) => (
                  <SelectItem key={i} value={i} className="text-xs">
                    {STAKEHOLDER_INTEREST_LABELS[i]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={styles.fieldCol()}>
          <Label htmlFor="stakeholder-parent" className={styles.label()}>
            Superior na Organização (Opcional)
          </Label>
          <div className={styles.controlWrap()}>
            <Select
              value={parentStakeholderId || "auto"}
              onValueChange={(value) =>
                onParentChange(value === "auto" ? null : value)
              }
            >
              <SelectTrigger
                id="stakeholder-parent"
                className="w-full text-xs bg-card"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto" className="text-xs">
                  Automático (por Poder/Interesse)
                </SelectItem>
                {parentOptions.map((st) => (
                  <SelectItem key={st.id} value={st.id} className="text-xs">
                    {st.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
