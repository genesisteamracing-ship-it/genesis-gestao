import { tv } from "tailwind-variants";
import { Users, TrendingUp, Send, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CommunicationMetrics } from "@/types/communication";

const kpiCardStyles = tv({
  slots: {
    card: "rounded-2xl border border-border bg-card shadow-2xs transition-all hover:shadow-md",
    content: "p-5 flex items-start justify-between gap-3",
    infoWrapper: "flex flex-col gap-1 min-w-0 flex-1",
    label: "text-xs font-semibold text-muted-foreground leading-snug",
    value: "text-2xl font-extrabold tracking-tight text-foreground",
    description: "text-xs text-muted-foreground mt-2",
    iconWrapper: "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
  },
  variants: {
    theme: {
      primary: {
        iconWrapper: "bg-primary/15 text-primary",
      },
      purple: {
        iconWrapper: "bg-purple/15 text-purple",
      },
      warning: {
        iconWrapper: "bg-warning/15 text-warning",
      },
      success: {
        iconWrapper: "bg-success/15 text-success",
      },
    },
  },
  defaultVariants: {
    theme: "primary",
  },
});

interface CommunicationKpisProps {
  metrics: CommunicationMetrics;
}

export function CommunicationKpis({ metrics }: CommunicationKpisProps) {
  const c1 = kpiCardStyles({ theme: "primary" });
  const c2 = kpiCardStyles({ theme: "purple" });
  const c3 = kpiCardStyles({ theme: "warning" });
  const c4 = kpiCardStyles({ theme: "success" });

  return (
    <section aria-label="Métricas Principais de Comunicação" className="w-full">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {/* Card 1: Total de Stakeholders */}
        <Card className={c1.card()}>
          <CardContent className={c1.content()}>
            <div className={c1.infoWrapper()}>
              <span className={c1.label()}>Stakeholders Mapeados</span>
              <span className={c1.value()}>{metrics.totalStakeholders}</span>
              <span className={c1.description()}>
                {metrics.highPowerCount} de alto poder decisório
              </span>
            </div>
            <div className={c1.iconWrapper()} aria-hidden="true">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Média de Engajamento */}
        <Card className={c2.card()}>
          <CardContent className={c2.content()}>
            <div className={c2.infoWrapper()}>
              <span className={c2.label()}>Índice de Engajamento</span>
              <span className={c2.value()}>{metrics.engagementAverageScore} / 5.0</span>
              <span className={c2.description()}>Média ponderada da equipe</span>
            </div>
            <div className={c2.iconWrapper()} aria-hidden="true">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Disparos Realizados */}
        <Card className={c3.card()}>
          <CardContent className={c3.content()}>
            <div className={c3.infoWrapper()}>
              <span className={c3.label()}>Comunicações Enviadas</span>
              <span className={c3.value()}>{metrics.totalDispatches}</span>
              <span className={c3.description()}>
                {metrics.totalPlans} réguas ativas configuradas
              </span>
            </div>
            <div className={c3.iconWrapper()} aria-hidden="true">
              <Send className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Ciclos de Feedback com Ação */}
        <Card className={c4.card()}>
          <CardContent className={c4.content()}>
            <div className={c4.infoWrapper()}>
              <span className={c4.label()}>Melhoria Contínua</span>
              <span className={c4.value()}>{metrics.addressedFeedbacksPercent}%</span>
              <span className={c4.description()}>
                {metrics.addressedFeedbacksCount} feedbacks atendidos com melhorias
              </span>
            </div>
            <div className={c4.iconWrapper()} aria-hidden="true">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
