import { tv } from "tailwind-variants";
import { ArrowRight, Sparkles, ShieldCheck, HelpCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StakeholderMatrixItem } from "@/types/communication";
import {
  ENGAGEMENT_LEVEL_LABELS,
  STAKEHOLDER_GROUP_LABELS,
  COMMUNICATION_CHANNEL_LABELS,
} from "@/lib/communication-constants";

const matrixStyles = tv({
  slots: {
    container: "space-y-6 w-full",
    quadrantGrid: "grid grid-cols-1 md:grid-cols-2 gap-4",
    quadrantCard: "border-border bg-card flex flex-col justify-between",
    quadrantHeader: "p-4 pb-2 border-b border-border/50 flex items-start justify-between gap-2",
    quadrantTitle: "text-sm sm:text-base font-semibold flex items-center gap-2 text-foreground",
    quadrantDescription: "text-xs text-muted-foreground mt-0.5",
    quadrantContent: "p-4 space-y-2.5 flex-1",
    stakeholderChip: "p-2.5 rounded-md border border-border/60 bg-muted/30 hover:bg-muted/60 transition-colors flex flex-col gap-1",
    gapSection: "space-y-3",
  },
  variants: {
    quadrantType: {
      MANAGE_CLOSELY: {
        quadrantCard: "border-primary/40 bg-primary/5",
        quadrantTitle: "text-primary",
      },
      KEEP_SATISFIED: {
        quadrantCard: "border-blue-500/30 bg-blue-500/5",
        quadrantTitle: "text-blue-700 dark:text-blue-400",
      },
      KEEP_INFORMED: {
        quadrantCard: "border-emerald-500/30 bg-emerald-500/5",
        quadrantTitle: "text-emerald-700 dark:text-emerald-400",
      },
      MONITOR: {
        quadrantCard: "border-muted-foreground/20 bg-muted/10",
        quadrantTitle: "text-muted-foreground",
      },
    },
  },
});

interface StakeholderMatrixProps {
  items: StakeholderMatrixItem[];
  onSelectStakeholder?: (stakeholderId: string) => void;
}

export function StakeholderMatrix({ items, onSelectStakeholder }: StakeholderMatrixProps) {
  const styles = matrixStyles();

  const manageClosely = items.filter((i) => i.quadrant === "MANAGE_CLOSELY");
  const keepSatisfied = items.filter((i) => i.quadrant === "KEEP_SATISFIED");
  const keepInformed = items.filter((i) => i.quadrant === "KEEP_INFORMED");
  const monitor = items.filter((i) => i.quadrant === "MONITOR");

  return (
    <div className={styles.container()}>
      {/* 1. Grade 2x2 da Matriz Poder x Interesse */}
      <div>
        <div className="mb-3">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">
            Matriz de Poder vs. Interesse (Mendelow)
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Direciona a prioridade e o tom de voz estratégico de cada relacionamento da equipe STEM.
          </p>
        </div>

        <div className={styles.quadrantGrid()}>
          {/* Quadrante 1: Alto Poder / Alto Interesse (Gerenciar de Perto) */}
          <Card className={matrixStyles({ quadrantType: "MANAGE_CLOSELY" }).quadrantCard()}>
            <div className={styles.quadrantHeader()}>
              <div>
                <CardTitle className={matrixStyles({ quadrantType: "MANAGE_CLOSELY" }).quadrantTitle()}>
                  <Sparkles className="h-4 w-4" />
                  Gerenciar de Perto (Alto Poder / Alto Interesse)
                </CardTitle>
                <CardDescription className={styles.quadrantDescription()}>
                  Parceiros estratégicos chave e patrocinadores Ouro/Diamante. Foco total em ROI e alinhamento frequente.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {manageClosely.length}
              </Badge>
            </div>
            <CardContent className={styles.quadrantContent()}>
              {manageClosely.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-3 text-center">
                  Nenhum stakeholder mapeado neste quadrante.
                </p>
              ) : (
                manageClosely.map((s) => (
                  <div key={s.id} className={styles.stakeholderChip()}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                        {s.name}
                      </span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {STAKEHOLDER_GROUP_LABELS[s.group]}
                      </Badge>
                    </div>
                    {s.organization && (
                      <span className="text-xs text-muted-foreground truncate">
                        {s.organization}
                      </span>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quadrante 2: Alto Poder / Baixo Interesse (Manter Satisfeito) */}
          <Card className={matrixStyles({ quadrantType: "KEEP_SATISFIED" }).quadrantCard()}>
            <div className={styles.quadrantHeader()}>
              <div>
                <CardTitle className={matrixStyles({ quadrantType: "KEEP_SATISFIED" }).quadrantTitle()}>
                  <ShieldCheck className="h-4 w-4" />
                  Manter Satisfeito (Alto Poder / Baixo Interesse)
                </CardTitle>
                <CardDescription className={styles.quadrantDescription()}>
                  Direção escolar e comissões reguladoras. Envie balanços consolidados e cumpra prazos institucionais.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {keepSatisfied.length}
              </Badge>
            </div>
            <CardContent className={styles.quadrantContent()}>
              {keepSatisfied.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-3 text-center">
                  Nenhum stakeholder mapeado neste quadrante.
                </p>
              ) : (
                keepSatisfied.map((s) => (
                  <div key={s.id} className={styles.stakeholderChip()}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                        {s.name}
                      </span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {STAKEHOLDER_GROUP_LABELS[s.group]}
                      </Badge>
                    </div>
                    {s.organization && (
                      <span className="text-xs text-muted-foreground truncate">
                        {s.organization}
                      </span>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quadrante 3: Baixo Poder / Alto Interesse (Manter Informado) */}
          <Card className={matrixStyles({ quadrantType: "KEEP_INFORMED" }).quadrantCard()}>
            <div className={styles.quadrantHeader()}>
              <div>
                <CardTitle className={matrixStyles({ quadrantType: "KEEP_INFORMED" }).quadrantTitle()}>
                  <HelpCircle className="h-4 w-4" />
                  Manter Informado (Baixo Poder / Alto Interesse)
                </CardTitle>
                <CardDescription className={styles.quadrantDescription()}>
                  Pais, responsáveis, mentores e comunidade. Atualizações via WhatsApp e convites para feiras/pit stops.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {keepInformed.length}
              </Badge>
            </div>
            <CardContent className={styles.quadrantContent()}>
              {keepInformed.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-3 text-center">
                  Nenhum stakeholder mapeado neste quadrante.
                </p>
              ) : (
                keepInformed.map((s) => (
                  <div key={s.id} className={styles.stakeholderChip()}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                        {s.name}
                      </span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {STAKEHOLDER_GROUP_LABELS[s.group]}
                      </Badge>
                    </div>
                    {s.organization && (
                      <span className="text-xs text-muted-foreground truncate">
                        {s.organization}
                      </span>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quadrante 4: Baixo Poder / Baixo Interesse (Monitorar) */}
          <Card className={matrixStyles({ quadrantType: "MONITOR" }).quadrantCard()}>
            <div className={styles.quadrantHeader()}>
              <div>
                <CardTitle className={matrixStyles({ quadrantType: "MONITOR" }).quadrantTitle()}>
                  <AlertCircle className="h-4 w-4" />
                  Monitorar (Baixo Poder / Baixo Interesse)
                </CardTitle>
                <CardDescription className={styles.quadrantDescription()}>
                  Apoiadores pontuais e fãs em redes sociais. Comunicação em grandes marcos da temporada.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {monitor.length}
              </Badge>
            </div>
            <CardContent className={styles.quadrantContent()}>
              {monitor.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-3 text-center">
                  Nenhum stakeholder mapeado neste quadrante.
                </p>
              ) : (
                monitor.map((s) => (
                  <div key={s.id} className={styles.stakeholderChip()}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                        {s.name}
                      </span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {STAKEHOLDER_GROUP_LABELS[s.group]}
                      </Badge>
                    </div>
                    {s.organization && (
                      <span className="text-xs text-muted-foreground truncate">
                        {s.organization}
                      </span>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2. Matriz de Avaliação de Engajamento (Gap Analysis Atual vs Almejado) */}
      <Card className="border-border bg-card">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-base sm:text-lg">
            Matriz de Avaliação do Engajamento (Gap Analysis)
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Evolução planejada do nível de engajamento atual (C) até o nível desejado (D) para cada parte interessada.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum stakeholder cadastrado para análise de gap.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[160px]">Parte Interessada</TableHead>
                    <TableHead className="min-w-[140px]">Grupo</TableHead>
                    <TableHead className="min-w-[180px]">Transição de Engajamento</TableHead>
                    <TableHead className="min-w-[120px]">Canal Preferencial</TableHead>
                    <TableHead className="text-right min-w-[100px]">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const isGap = item.currentEngagement !== item.targetEngagement;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div>
                            <span className="text-foreground">{item.name}</span>
                            {item.organization && (
                              <span className="block text-xs text-muted-foreground">
                                {item.organization}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {STAKEHOLDER_GROUP_LABELS[item.group]}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs">
                            <Badge variant="outline" className="font-normal text-muted-foreground">
                              {ENGAGEMENT_LEVEL_LABELS[item.currentEngagement]}
                            </Badge>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <Badge
                              variant={isGap ? "default" : "secondary"}
                              className="font-medium shrink-0"
                            >
                              {ENGAGEMENT_LEVEL_LABELS[item.targetEngagement]}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {COMMUNICATION_CHANNEL_LABELS[item.preferredChannel]}
                        </TableCell>
                        <TableCell className="text-right">
                          {onSelectStakeholder && (
                            <button
                              type="button"
                              onClick={() => onSelectStakeholder(item.id)}
                              className="text-xs text-primary hover:underline font-medium"
                            >
                              Gerar Relatório
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
