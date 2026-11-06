"use client";

import * as React from "react";
import { tv } from "tailwind-variants";
import {
  Boxes,
  CheckCircle2,
  Clock,
  DollarSign,
  Layers,
} from "lucide-react";
import type { WbsSummaryMetrics } from "@/types/wbs";
import { formatCentsToReais } from "@/lib/utils";

const metricCardStyles = tv({
  slots: {
    card: "relative overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs transition-all hover:shadow-xs",
    header: "flex items-center justify-between gap-2",
    title: "text-xs font-semibold text-muted-foreground uppercase tracking-wider",
    iconWrapper: "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
    value: "mt-3 text-xl sm:text-2xl font-bold tracking-tight text-foreground",
    footer: "mt-1 flex items-center gap-1.5 text-xs text-muted-foreground",
  },
  variants: {
    intent: {
      default: {
        iconWrapper: "bg-muted text-foreground",
      },
      primary: {
        iconWrapper: "bg-primary/10 text-primary",
      },
      success: {
        iconWrapper: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      },
      warning: {
        iconWrapper: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      },
      purple: {
        iconWrapper: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      },
    },
  },
  defaultVariants: {
    intent: "default",
  },
});

interface WbsHeaderMetricsProps {
  metrics: WbsSummaryMetrics;
  isLoading?: boolean;
}

export function WbsHeaderMetrics({ metrics, isLoading = false }: WbsHeaderMetricsProps) {
  const styles = metricCardStyles();

  const progressPercent =
    metrics.totalDeliverables > 0
      ? Math.round(
          (metrics.completedDeliverables / metrics.totalDeliverables) * 100
        )
      : 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-border bg-card animate-pulse p-4"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {/* 1. Total de Entregáveis / Pacotes */}
      <div className={styles.card()}>
        <div className={styles.header()}>
          <span className={styles.title()}>Entregáveis Totais</span>
          <div className={metricCardStyles({ intent: "primary" }).iconWrapper()}>
            <Boxes className="h-4 w-4" />
          </div>
        </div>
        <div className={styles.value()}>{metrics.totalDeliverables}</div>
        <div className={styles.footer()}>
          <Layers className="h-3.5 w-3.5 shrink-0" />
          <span>
            {metrics.totalWorkPackages} pacotes de trabalho folha
          </span>
        </div>
      </div>

      {/* 2. Custo Consolidado da EAP (Regra dos 100%) */}
      <div className={styles.card()}>
        <div className={styles.header()}>
          <span className={styles.title()}>Custo Previsto EAP</span>
          <div className={metricCardStyles({ intent: "warning" }).iconWrapper()}>
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
        <div className={styles.value()}>
          {formatCentsToReais(metrics.totalRollupCostCents)}
        </div>
        <div className={styles.footer()}>
          <span>Soma consolidada 100% da árvore</span>
        </div>
      </div>

      {/* 3. Horas Totais Estimadas */}
      <div className={styles.card()}>
        <div className={styles.header()}>
          <span className={styles.title()}>Esforço Estimado</span>
          <div className={metricCardStyles({ intent: "purple" }).iconWrapper()}>
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className={styles.value()}>
          {metrics.totalRollupHours}h
        </div>
        <div className={styles.footer()}>
          <span>Dedicação técnica estimada</span>
        </div>
      </div>

      {/* 4. Conclusão & Auditoria */}
      <div className={styles.card()}>
        <div className={styles.header()}>
          <span className={styles.title()}>Concluídos / Auditados</span>
          <div className={metricCardStyles({ intent: "success" }).iconWrapper()}>
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className={styles.value()}>
          {metrics.completedDeliverables}
          <span className="text-xs font-medium text-muted-foreground ml-1.5">
            ({progressPercent}%)
          </span>
        </div>
        <div className={styles.footer()}>
          <span>Status auditado de escopo</span>
        </div>
      </div>
    </div>
  );
}
