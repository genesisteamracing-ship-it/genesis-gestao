"use client";

import * as React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { tv } from "tailwind-variants";
import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import { formatPertDays } from "@/lib/pert-engine";
import type { PertFlowNode } from "./pert-flow.adapter";

const pertNodeStyles = tv({
  slots: {
    card: "group flex w-[256px] flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    topRow: "grid grid-cols-3 divide-x divide-border border-b border-border text-center text-[11px]",
    bottomRow: "grid grid-cols-3 divide-x divide-border border-t border-border text-center text-[11px]",
    metricCell: "flex flex-col justify-center px-1.5 py-1",
    metricLabel: "text-[9px] font-semibold uppercase tracking-wide text-muted-foreground",
    metricValue: "font-semibold tabular-nums text-foreground",
    body: "flex flex-col gap-1 px-3 py-2.5 text-left",
    title: "line-clamp-2 text-xs font-semibold leading-snug text-foreground",
    meta: "flex items-center justify-between gap-2 text-[11px] text-muted-foreground",
    handle: "!h-2.5 !w-2.5 !border-2 !border-background",
  },
  variants: {
    critical: {
      true: {
        card: "border-destructive ring-1 ring-destructive/30 hover:shadow-md",
        topRow: "bg-destructive/10 border-destructive/30 divide-destructive/20",
        bottomRow: "bg-destructive/5 border-destructive/30 divide-destructive/20",
        handle: "!bg-destructive",
      },
      false: {
        card: "border-border hover:border-primary/60 hover:shadow-sm",
        topRow: "bg-muted/40",
        bottomRow: "bg-muted/20",
        handle: "!bg-muted-foreground",
      },
    },
    dimmed: {
      true: {
        card: "opacity-25 hover:opacity-80",
      },
      false: {},
    },
  },
});

export function PertTaskNode({ data }: NodeProps<PertFlowNode>) {
  const { metrics, dimmed, onSelect } = data;
  const styles = pertNodeStyles({ critical: metrics.isCritical, dimmed });

  return (
    <button
      type="button"
      onClick={() => onSelect(metrics.task.id)}
      className={styles.card()}
      aria-label={`Abrir tarefa ${metrics.task.title}${metrics.isCritical ? " (Caminho crítico)" : ""}`}
    >
      <Handle type="target" position={Position.Left} className={styles.handle()} />

      <div className={styles.topRow()}>
        <div className={styles.metricCell()} title="Início mais cedo (ES)">
          <span className={styles.metricLabel()}>ES</span>
          <span className={styles.metricValue()}>{formatPertDays(metrics.earlyStart)}</span>
        </div>
        <div className={styles.metricCell()} title="Duração esperada (Te)">
          <span className={styles.metricLabel()}>
            {metrics.durationSource === "pert" ? "Te" : "Dur"}
          </span>
          <span className={styles.metricValue()}>{formatPertDays(metrics.expectedDuration)}d</span>
        </div>
        <div className={styles.metricCell()} title="Término mais cedo (EF)">
          <span className={styles.metricLabel()}>EF</span>
          <span className={styles.metricValue()}>{formatPertDays(metrics.earlyFinish)}</span>
        </div>
      </div>

      <div className={styles.body()}>
        <span className={styles.title()}>{metrics.task.title}</span>
        <div className={styles.meta()}>
          <span className="truncate">{DELIVERY_GROUP_LABELS[metrics.task.deliveryGroup]}</span>
          {metrics.isCritical && (
            <span className="shrink-0 font-semibold text-destructive">Crítica</span>
          )}
        </div>
      </div>

      <div className={styles.bottomRow()}>
        <div className={styles.metricCell()} title="Início mais tarde (LS)">
          <span className={styles.metricLabel()}>LS</span>
          <span className={styles.metricValue()}>{formatPertDays(metrics.lateStart)}</span>
        </div>
        <div className={styles.metricCell()} title="Folga total (Slack)">
          <span className={styles.metricLabel()}>Folga</span>
          <span
            className={styles.metricValue({
              className: metrics.isCritical ? "text-destructive" : undefined,
            })}
          >
            {formatPertDays(metrics.totalSlack)}d
          </span>
        </div>
        <div className={styles.metricCell()} title="Término mais tarde (LF)">
          <span className={styles.metricLabel()}>LF</span>
          <span className={styles.metricValue()}>{formatPertDays(metrics.lateFinish)}</span>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className={styles.handle()} />
    </button>
  );
}
