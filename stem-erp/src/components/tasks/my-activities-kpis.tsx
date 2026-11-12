"use client";

import { AlertTriangle, CheckCircle2, Clock, ListChecks, TrendingUp } from "lucide-react";
import { tv, type VariantProps } from "tailwind-variants";
import type { UserActivityKpis } from "@/lib/my-activities";

const kpiCardStyles = tv({
  slots: {
    card: "flex flex-col justify-between gap-2 rounded-xl border border-border bg-card p-4 shadow-2xs",
    header: "flex items-center justify-between gap-2",
    label: "text-xs font-medium text-muted-foreground",
    iconBox: "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
    value: "text-2xl font-bold tracking-tight text-foreground",
    helper: "text-xs text-muted-foreground",
  },
  variants: {
    tone: {
      neutral: { iconBox: "bg-primary/10 text-primary" },
      success: { iconBox: "bg-success/10 text-success" },
      warning: { iconBox: "bg-warning/10 text-warning" },
      danger: { iconBox: "bg-destructive/10 text-destructive" },
    },
  },
  defaultVariants: {
    tone: "neutral",
  },
});

type KpiTone = VariantProps<typeof kpiCardStyles>["tone"];

type KpiCardItem = {
  id: string;
  label: string;
  value: string;
  helper: string;
  tone: KpiTone;
  icon: typeof ListChecks;
};

export function MyActivitiesKpis({ kpis }: { kpis: UserActivityKpis }) {
  const items: KpiCardItem[] = [
    {
      id: "total",
      label: "Total atribuído",
      value: String(kpis.totalAssigned),
      helper: kpis.cancelledCount > 0 ? `${kpis.cancelledCount} cancelada(s)` : "Atividades na equipe",
      tone: "neutral",
      icon: ListChecks,
    },
    {
      id: "completed",
      label: "Concluídas",
      value: String(kpis.completedCount),
      helper: `${kpis.completionRate}% de conclusão`,
      tone: "success",
      icon: CheckCircle2,
    },
    {
      id: "pending",
      label: "Pendentes",
      value: String(kpis.pendingCount),
      helper: "A fazer ou em andamento",
      tone: "warning",
      icon: Clock,
    },
    {
      id: "overdue",
      label: "Em atraso",
      value: String(kpis.overdueCount),
      helper: kpis.overdueCount > 0 ? "Requer atenção imediata" : "Nenhuma pendência vencida",
      tone: kpis.overdueCount > 0 ? "danger" : "neutral",
      icon: AlertTriangle,
    },
    {
      id: "punctuality",
      label: "Pontualidade",
      value: kpis.punctualityRate === null ? "—" : `${kpis.punctualityRate}%`,
      helper:
        kpis.punctualityRate === null
          ? "Sem entregas concluídas"
          : `${kpis.onTimeCompletedCount} de ${kpis.completedCount} no prazo`,
      tone: kpis.punctualityRate !== null && kpis.punctualityRate >= 80 ? "success" : "neutral",
      icon: TrendingUp,
    },
  ];

  return (
    <section aria-label="Indicadores de desempenho individual" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;
        const styles = kpiCardStyles({ tone: item.tone });
        return (
          <div key={item.id} className={styles.card()}>
            <div className={styles.header()}>
              <span className={styles.label()}>{item.label}</span>
              <span className={styles.iconBox()} aria-hidden="true">
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <div className={styles.value()}>{item.value}</div>
            <p className={styles.helper()}>{item.helper}</p>
          </div>
        );
      })}
    </section>
  );
}
