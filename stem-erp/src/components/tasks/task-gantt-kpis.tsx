"use client";

import { BarChart3, Clock, Flag, Layers } from "lucide-react";
import { tv, type VariantProps } from "tailwind-variants";
import { formatDeviationDays, type GanttSummary, type MilestoneStatus } from "@/lib/task-gantt-metrics";

const kpiCard = tv({
  slots: {
    root: "flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-2xs transition-colors",
    iconWrap: "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40",
    divider: "h-9 w-px shrink-0 bg-border/80",
    body: "min-w-0 flex-1 space-y-1",
    label: "text-xs font-medium text-muted-foreground",
    value: "text-xl font-bold leading-none tracking-tight text-foreground",
  },
  variants: {
    tone: {
      neutral: {
        root: "border-border bg-card",
        iconWrap: "bg-muted/50 text-foreground",
      },
      success: {
        root: "border-success/25 bg-success/5",
        iconWrap: "border-success/25 bg-success/10 text-success",
        value: "text-success",
      },
      warning: {
        root: "border-warning/30 bg-warning/5",
        iconWrap: "border-warning/30 bg-warning/10 text-warning",
        value: "text-warning",
      },
      destructive: {
        root: "border-destructive/25 bg-destructive/5",
        iconWrap: "border-destructive/25 bg-destructive/10 text-destructive",
        value: "text-destructive",
      },
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
});

const milestonePill = tv({
  base: "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold leading-none",
  variants: {
    status: {
      ON_TRACK: "bg-success/15 text-success",
      COMPLETED: "bg-success/20 text-success",
      AT_RISK: "bg-warning/25 text-foreground",
      DELAYED: "bg-destructive/15 text-destructive",
      EMPTY: "bg-muted text-muted-foreground",
    },
  },
  defaultVariants: {
    status: "EMPTY",
  },
});

type CardTone = NonNullable<VariantProps<typeof kpiCard>["tone"]>;

function milestoneTone(status: MilestoneStatus): CardTone {
  if (status === "DELAYED") return "destructive";
  if (status === "AT_RISK") return "warning";
  if (status === "ON_TRACK" || status === "COMPLETED") return "success";
  return "neutral";
}

export interface TaskGanttKpisProps {
  summary: GanttSummary;
  className?: string;
}

export function TaskGanttKpis({ summary, className }: TaskGanttKpisProps) {
  const progressStyles = kpiCard({ tone: "success" });
  const criticalStyles = kpiCard({ tone: summary.criticalCount > 0 ? "neutral" : "neutral" });
  const deviationStyles = kpiCard({
    tone: summary.deviationDays > 0 ? "destructive" : summary.deviationDays < 0 ? "success" : "neutral",
  });
  const milestoneStyles = kpiCard({ tone: milestoneTone(summary.milestoneStatus) });

  return (
    <div
      aria-label="Indicadores do cronograma"
      className={`grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 ${className ?? ""}`}
    >
      {/* 1. Progresso geral */}
      <article className={progressStyles.root()}>
        <div className={progressStyles.iconWrap()} aria-hidden="true">
          <BarChart3 className="h-5 w-5" />
        </div>
        <span className={progressStyles.divider()} aria-hidden="true" />
        <div className={progressStyles.body()}>
          <p className={progressStyles.label()}>Progresso geral:</p>
          <div className="flex items-center gap-2.5">
            <span className={progressStyles.value()}>{summary.progressPercent}%</span>
            <div
              role="progressbar"
              aria-label="Progresso geral do cronograma"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={summary.progressPercent}
              className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-success transition-all duration-300"
                style={{ width: `${summary.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </article>

      {/* 2. Atividades críticas */}
      <article className={criticalStyles.root()}>
        <div className={criticalStyles.iconWrap()} aria-hidden="true">
          <Layers className="h-5 w-5" />
        </div>
        <span className={criticalStyles.divider()} aria-hidden="true" />
        <div className={criticalStyles.body()}>
          <p className={criticalStyles.label()}>Atividades críticas:</p>
          <p className={criticalStyles.value()}>{summary.criticalCount}</p>
        </div>
      </article>

      {/* 3. Desvio atual */}
      <article className={deviationStyles.root()}>
        <div className={deviationStyles.iconWrap()} aria-hidden="true">
          <Clock className="h-5 w-5" />
        </div>
        <span className={deviationStyles.divider()} aria-hidden="true" />
        <div className={deviationStyles.body()}>
          <p className={deviationStyles.label()}>Desvio atual:</p>
          <p className={deviationStyles.value()}>{formatDeviationDays(summary.deviationDays)}</p>
        </div>
      </article>

      {/* 4. Marco final */}
      <article className={milestoneStyles.root()}>
        <div className={milestoneStyles.iconWrap()} aria-hidden="true">
          <Flag className="h-5 w-5" />
        </div>
        <span className={milestoneStyles.divider()} aria-hidden="true" />
        <div className={milestoneStyles.body()}>
          <p className={milestoneStyles.label()}>Marco final:</p>
          <div>
            <span className={milestonePill({ status: summary.milestoneStatus })}>
              {summary.milestoneLabel}
            </span>
          </div>
        </div>
      </article>
    </div>
  );
}
