"use client";

import * as React from "react";
import {
  Award,
  Calculator,
  Coins,
  Handshake,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { tv } from "tailwind-variants";
import { formatCurrencyFromCents } from "@/lib/utils";
import type { DashboardMetricsDTO } from "@/types/financial";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { useRoiModule } from "@/hooks/use-roi-module";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const roiKpiCardStyles = tv({
  slots: {
    card: "rounded-2xl border border-border bg-card p-5 shadow-2xs transition-all hover:shadow-md",
    iconBox: "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
  },
  variants: {
    tone: {
      primary: { iconBox: "bg-primary/15 text-primary" },
      success: { iconBox: "bg-success/15 text-success" },
      purple: { iconBox: "bg-purple/15 text-purple" },
      warning: { iconBox: "bg-warning/15 text-warning" },
    },
  },
  defaultVariants: {
    tone: "primary",
  },
});

interface RoiViewProps {
  initialMetrics: DashboardMetricsDTO;
}

export function RoiView({ initialMetrics }: RoiViewProps) {
  const { metrics } = useDashboardMetrics({ initialData: initialMetrics });
  const data = metrics ?? initialMetrics;

  const {
    summary,
    simulation,
    sponsorInvestmentReais,
    setSponsorInvestmentReais,
    estimatedReach,
    setEstimatedReach,
    cpmEstimateReais,
    setCpmEstimateReais,
    brandActivationsReais,
    setBrandActivationsReais,
  } = useRoiModule(data);

  return (
    <DashboardShell
      title="ROI & Retorno de Patrocínio"
      currentUser={data.currentUser}
      activeTeam={data.activeTeam}
      availableTeams={data.availableTeams}
      categories={data.categories}
      budgetResources={data.budgetResources}
    >
      {/* 1. 4 KPIs de ROI da Escuderia */}
      <section
        aria-label="Indicadores de Retorno sobre Investimento"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className={roiKpiCardStyles({ tone: "primary" }).card()}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                ROI Global do Projeto
              </p>
              <p className="text-2xl font-extrabold tracking-tight text-foreground">
                {summary.projectRoiPercent >= 0 ? "+" : ""}
                {summary.projectRoiPercent}%
              </p>
            </div>
            <div className={roiKpiCardStyles({ tone: "primary" }).iconBox()}>
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Relação entre recursos captados e aplicações realizadas
          </p>
        </div>

        <div className={roiKpiCardStyles({ tone: "success" }).card()}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Captação & Parcerias Totais
              </p>
              <p className="text-2xl font-extrabold tracking-tight text-foreground">
                {formatCurrencyFromCents(summary.totalCaptationCents)}
              </p>
            </div>
            <div className={roiKpiCardStyles({ tone: "success" }).iconBox()}>
              <Coins className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Soma de aportes financeiros e permutas técnicas
          </p>
        </div>

        <div className={roiKpiCardStyles({ tone: "purple" }).card()}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Economia via Permutas
              </p>
              <p className="text-2xl font-extrabold tracking-tight text-foreground">
                {formatCurrencyFromCents(summary.barterSavingsCents)}
              </p>
            </div>
            <div className={roiKpiCardStyles({ tone: "purple" }).iconBox()}>
              <Handshake className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Custos evitados em caixa via parcerias in-loco
          </p>
        </div>

        <div className={roiKpiCardStyles({ tone: "warning" }).card()}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Cobertura Orçamentária
              </p>
              <p className="text-2xl font-extrabold tracking-tight text-foreground">
                {summary.coveragePercent}%
              </p>
            </div>
            <div className={roiKpiCardStyles({ tone: "warning" }).iconBox()}>
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3">
            <Progress value={Math.min(100, summary.coveragePercent)} />
          </div>
        </div>
      </section>

      {/* 2. Simulador de ROI para Patrocinadores */}
      <Card className="rounded-2xl border-border bg-card shadow-2xs">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">
                  Simulador de ROI para Patrocinadores
                </CardTitle>
                <CardDescription className="text-xs">
                  Calcule o retorno de exposição de marca e mídia espontânea para
                  apresentações comerciais de patrocínio
                </CardDescription>
              </div>
            </div>
            <Badge variant="success" className="gap-1">
              <Award className="h-3.5 w-3.5" />
              <span>Múltiplo de Retorno: {simulation.returnMultiple}x</span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Inputs da Simulação */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
              <div className="space-y-1.5">
                <Label htmlFor="sponsor-inv" className="text-xs font-semibold">
                  Cota de Patrocínio Investida (R$)
                </Label>
                <Input
                  id="sponsor-inv"
                  value={sponsorInvestmentReais}
                  onChange={(e) => setSponsorInvestmentReais(e.target.value)}
                  placeholder="2500,00"
                />
                <p className="text-[11px] text-muted-foreground">
                  Valor do aporte financeiro ou permuta do patrocinador
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sponsor-reach" className="text-xs font-semibold">
                  Alcance Estimado (Impressões / Público)
                </Label>
                <Input
                  id="sponsor-reach"
                  type="number"
                  min={0}
                  value={estimatedReach}
                  onChange={(e) => setEstimatedReach(e.target.value)}
                  placeholder="15000"
                />
                <p className="text-[11px] text-muted-foreground">
                  Redes sociais, eventos, oficinas sociais e Pit Display
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sponsor-cpm" className="text-xs font-semibold">
                  CPM Equivalente de Mídia (R$)
                </Label>
                <Input
                  id="sponsor-cpm"
                  value={cpmEstimateReais}
                  onChange={(e) => setCpmEstimateReais(e.target.value)}
                  placeholder="40,00"
                />
                <p className="text-[11px] text-muted-foreground">
                  Custo por mil impressões em público nichado STEM
                </p>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="sponsor-activations"
                  className="text-xs font-semibold"
                >
                  Valor de Ativações Diretas (R$)
                </Label>
                <Input
                  id="sponsor-activations"
                  value={brandActivationsReais}
                  onChange={(e) => setBrandActivationsReais(e.target.value)}
                  placeholder="1800,00"
                />
                <p className="text-[11px] text-muted-foreground">
                  Logo no carro F1, uniforme, estande e portfólio oficial
                </p>
              </div>
            </div>

            {/* Painel de Resultado da Simulação */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-muted/40 p-5 lg:col-span-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Valor investido pela marca:
                  </span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatCurrencyFromCents(simulation.investmentCents)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Valoração de mídia (Alcance):
                  </span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatCurrencyFromCents(simulation.mediaValuationCents)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Valoração de ativações físicas:
                  </span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatCurrencyFromCents(simulation.activationsCents)}
                  </span>
                </div>

                <div className="border-t border-border pt-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Retorno Total Entregue:
                  </span>
                  <span className="font-mono text-base font-extrabold text-primary">
                    {formatCurrencyFromCents(
                      simulation.totalDeliveredValueCents
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-card p-3.5 border border-border">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    ROI Estimado ao Patrocinador
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ganho líquido:{" "}
                    {formatCurrencyFromCents(simulation.netReturnCents)}
                  </p>
                </div>
                <div
                  className={`text-2xl font-extrabold font-mono ${
                    simulation.sponsorRoiPercent >= 0
                      ? "text-success"
                      : "text-destructive"
                  }`}
                >
                  {simulation.sponsorRoiPercent >= 0 ? "+" : ""}
                  {simulation.sponsorRoiPercent}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Eficiência e Retorno por Setor da Equipe */}
      <Card className="rounded-2xl border-border bg-card shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">
            Eficiência Orçamentária & Retorno por Setor
          </CardTitle>
          <CardDescription className="text-xs">
            Análise comparativa entre orçamento planejado, captação via parcerias
            e economia gerada por grupo de entrega
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>SETOR / GRUPO DE ENTREGA</TableHead>
                  <TableHead>ORÇADO (PREVISTO)</TableHead>
                  <TableHead>REALIZADO (SAÍDA CAIXA)</TableHead>
                  <TableHead>PATROCÍNIO / PERMUTA</TableHead>
                  <TableHead>ECONOMIA / SALDO</TableHead>
                  <TableHead>STATUS DE EFICIÊNCIA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.sectorRows.map((row) => {
                  const isOverBudget =
                    row.realizedCents > row.plannedCents &&
                    row.plannedCents > 0;

                  return (
                    <TableRow key={row.deliveryGroup}>
                      <TableCell className="font-semibold text-foreground">
                        {row.label}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-foreground">
                        {formatCurrencyFromCents(row.plannedCents)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-foreground">
                        {formatCurrencyFromCents(row.realizedCents)}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-primary">
                        {formatCurrencyFromCents(row.sponsoredOrBarterCents)}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-success">
                        {formatCurrencyFromCents(row.savingsCents)}
                      </TableCell>
                      <TableCell>
                        {row.plannedCents === 0 && row.realizedCents === 0 ? (
                          <Badge variant="secondary">Sem alocação</Badge>
                        ) : isOverBudget ? (
                          <Badge variant="destructive">Acima do previsto</Badge>
                        ) : (
                          <Badge variant="success">
                            Alta Eficiência ({row.efficiencyPercent}% margem)
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
