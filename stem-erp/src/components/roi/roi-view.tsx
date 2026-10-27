"use client";

import * as React from "react";
import Link from "next/link";
import {
  Award,
  Building2,
  Calculator,
  Coins,
  Crown,
  Gem,
  Handshake,
  Medal,
  Megaphone,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { tv } from "tailwind-variants";
import { toast } from "sonner";
import { SPONSOR_TIER_LABELS } from "@/lib/constants";
import { formatCurrencyFromCents } from "@/lib/utils";
import { deleteSponsorAction } from "@/actions/financial-actions";
import type { DashboardMetricsDTO, SponsorRoiSummaryDTO } from "@/types/financial";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { useInvalidateDashboard } from "@/hooks/use-invalidate-dashboard";
import { useRoiModule } from "@/hooks/use-roi-module";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StateView } from "@/components/ui/state-view";
import { SponsorTierBadge } from "@/components/roi/sponsor-tier-badge";
import { RoiCharts } from "@/components/roi/roi-charts";
import { CreateSponsorDialog } from "@/components/modals/create-sponsor-dialog";

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
  const invalidateDashboard = useInvalidateDashboard();
  const [isDeletingId, setIsDeletingId] = React.useState<string | null>(null);

  const {
    summary,
    simulation,
    sponsorAggregates,
    filteredSponsors,
    tierFilter,
    setTierFilter,
    searchQuery,
    setSearchQuery,
    sponsorInvestmentReais,
    setSponsorInvestmentReais,
    estimatedReach,
    setEstimatedReach,
    cpmEstimateReais,
    setCpmEstimateReais,
    brandActivationsReais,
    setBrandActivationsReais,
  } = useRoiModule(data);

  async function handleDeleteSponsor(id: string, name: string) {
    if (!confirm(`Tem certeza que deseja remover a empresa "${name}"? Os lançamentos permanecerão, mas o vínculo de patrocínio será desfeito.`)) {
      return;
    }

    setIsDeletingId(id);
    try {
      const res = await deleteSponsorAction({ id });
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      invalidateDashboard();
    } finally {
      setIsDeletingId(null);
    }
  }

  return (
    <DashboardShell
      title="ROI & Gestão de Patrocinadores"
      subtitle="Painel de contrapartidas, retorno sobre investimento das empresas e gestão de cotas"
      currentUser={data.currentUser}
      activeTeam={data.activeTeam}
      availableTeams={data.availableTeams}
      categories={data.categories}
      budgetResources={data.budgetResources}
      seasonMonths={data.seasonMonths}
      headerAction={
        <div className="flex items-center gap-2.5">
          <Link href="/roi/acoes">
            <Button variant="outline" className="gap-2 font-semibold border-border">
              <Megaphone className="h-4 w-4 text-primary" />
              <span>Ações de Retorno</span>
            </Button>
          </Link>
          <CreateSponsorDialog />
        </div>
      }
    >
      {/* 1. 4 KPIs de ROI dos Patrocinadores */}
      <section
        aria-label="Indicadores de Retorno sobre Investimento"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className={roiKpiCardStyles({ tone: "primary" }).card()}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Investimento Captado
              </p>
              <p className="text-2xl font-extrabold tracking-tight text-foreground">
                {formatCurrencyFromCents(sponsorAggregates.totalInvestedCents)}
              </p>
            </div>
            <div className={roiKpiCardStyles({ tone: "primary" }).iconBox()}>
              <Coins className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Soma dos lançamentos com contratos de patrocínio conectados
          </p>
        </div>

        <div className={roiKpiCardStyles({ tone: "success" }).card()}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Retorno Entregue às Marcas
              </p>
              <p className="text-2xl font-extrabold tracking-tight text-success">
                {formatCurrencyFromCents(sponsorAggregates.totalReturnCents)}
              </p>
            </div>
            <div className={roiKpiCardStyles({ tone: "success" }).iconBox()}>
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Valoração acumulada de ações, mídias e ativações da equipe
          </p>
        </div>

        <div className={roiKpiCardStyles({ tone: "purple" }).card()}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                ROI Médio Entregue
              </p>
              <p className="text-2xl font-extrabold tracking-tight text-foreground">
                {sponsorAggregates.globalRoiPercent >= 0 ? "+" : ""}
                {sponsorAggregates.globalRoiPercent}%{" "}
                <span className="text-sm font-semibold text-primary">
                  ({sponsorAggregates.globalMultiple})
                </span>
              </p>
            </div>
            <div className={roiKpiCardStyles({ tone: "purple" }).iconBox()}>
              <Award className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Múltiplo de valor gerado para cada R$ 1,00 aportado
          </p>
        </div>

        <div className={roiKpiCardStyles({ tone: "warning" }).card()}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Empresas por Cota
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                  <Gem className="h-3 w-3" />
                  {sponsorAggregates.tierCounts.DIAMOND}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-600 dark:text-yellow-400">
                  <Crown className="h-3 w-3" />
                  {sponsorAggregates.tierCounts.GOLD}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                  <Award className="h-3 w-3" />
                  {sponsorAggregates.tierCounts.SILVER}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                  <Medal className="h-3 w-3" />
                  {sponsorAggregates.tierCounts.BRONZE}
                </span>
              </div>
            </div>
            <div className={roiKpiCardStyles({ tone: "warning" }).iconBox()}>
              <Building2 className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Total de {sponsorAggregates.totalSponsorsCount} empresas parceiras ativas
          </p>
        </div>
      </section>

      {/* 2. Gráficos Intuitivos de ROI */}
      <RoiCharts sponsors={data.sponsorRoiSummaries ?? []} />

      {/* 3. Tabela & Vitrine de Empresas Patrocinadoras */}
      <Card className="rounded-2xl border-border bg-card shadow-2xs">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-bold">
                Empresas Patrocinadoras & Retorno Individual
              </CardTitle>
              <CardDescription className="text-xs">
                O investimento é apurado automaticamente a partir dos lançamentos
                de transações conectados a cada empresa
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-48 sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filtrar empresa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-8 text-xs"
                />
              </div>

              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="h-9 w-36 text-xs">
                  <SelectValue placeholder="Cota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas as Cotas</SelectItem>
                  <SelectItem value="DIAMOND">Diamante</SelectItem>
                  <SelectItem value="GOLD">Ouro</SelectItem>
                  <SelectItem value="SILVER">Prata</SelectItem>
                  <SelectItem value="BRONZE">Bronze</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredSponsors.length === 0 ? (
            <div className="p-8">
              <StateView
                state="empty"
                title="Nenhuma empresa patrocinadora encontrada"
                description={
                  sponsorAggregates.totalSponsorsCount === 0
                    ? "Adicione a primeira empresa parceira e vincule os lançamentos financeiros de patrocínio para calcular o investimento real."
                    : "Nenhuma empresa coincide com os filtros aplicados."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>EMPRESA</TableHead>
                    <TableHead>COTA</TableHead>
                    <TableHead>CONTATO</TableHead>
                    <TableHead className="text-center">LANÇAMENTOS</TableHead>
                    <TableHead className="text-right">INVESTIMENTO (R$)</TableHead>
                    <TableHead className="text-center">AÇÕES RETORNO</TableHead>
                    <TableHead className="text-right">RETORNO (R$)</TableHead>
                    <TableHead className="text-right">ROI ENTREGUE</TableHead>
                    <TableHead className="w-[60px] text-center">AÇÕES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSponsors.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-semibold text-foreground whitespace-nowrap">
                        <div className="space-y-0.5">
                          <p>{s.name}</p>
                          {s.notes && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {s.notes}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <SponsorTierBadge tier={s.tier} size="sm" />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {s.contactName || "-"}
                      </TableCell>
                      <TableCell className="text-center text-xs font-mono text-foreground">
                        {s.transactionsCount}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-bold text-foreground whitespace-nowrap">
                        {formatCurrencyFromCents(s.investedCents)}
                      </TableCell>
                      <TableCell className="text-center text-xs font-mono text-foreground">
                        {s.actionsCount}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-bold text-success whitespace-nowrap">
                        {formatCurrencyFromCents(s.deliveredReturnCents)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap font-mono text-xs">
                        <span
                          className={`font-bold ${
                            s.roiPercent >= 0 ? "text-success" : "text-destructive"
                          }`}
                        >
                          {s.roiPercent >= 0 ? "+" : ""}
                          {s.roiPercent}%
                        </span>{" "}
                        <span className="text-muted-foreground font-semibold">
                          ({s.returnMultiple})
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSponsor(s.id, s.name)}
                          disabled={isDeletingId === s.id}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                          aria-label={`Excluir empresa ${s.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Simulador Comercial de ROI para Patrocinadores */}
      <Card className="rounded-2xl border-border bg-card shadow-2xs">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">
                  Simulador de Apresentação Comercial de Patrocínio
                </CardTitle>
                <CardDescription className="text-xs">
                  Projeção de valoração de mídia, impressões e ativações de marca
                  para prospecção de novos patrocinadores
                </CardDescription>
              </div>
            </div>
            <Badge variant="success" className="gap-1">
              <Award className="h-3.5 w-3.5" />
              <span>Múltiplo Projetado: {simulation.returnMultiple}x</span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
              <div className="space-y-1.5">
                <Label htmlFor="sponsor-inv" className="text-xs font-semibold">
                  Cota de Patrocínio Proposta (R$)
                </Label>
                <Input
                  id="sponsor-inv"
                  value={sponsorInvestmentReais}
                  onChange={(e) => setSponsorInvestmentReais(e.target.value)}
                  placeholder="2500,00"
                />
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
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sponsor-activations" className="text-xs font-semibold">
                  Valor de Ativações Físicas (R$)
                </Label>
                <Input
                  id="sponsor-activations"
                  value={brandActivationsReais}
                  onChange={(e) => setBrandActivationsReais(e.target.value)}
                  placeholder="1800,00"
                />
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-border bg-muted/40 p-5 lg:col-span-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Valor investido proposto:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatCurrencyFromCents(simulation.investmentCents)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Valoração de mídia (Alcance):</span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatCurrencyFromCents(simulation.mediaValuationCents)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Valoração de ativações:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatCurrencyFromCents(simulation.activationsCents)}
                  </span>
                </div>

                <div className="border-t border-border pt-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Retorno Total Estimado:
                  </span>
                  <span className="font-mono text-base font-extrabold text-primary">
                    {formatCurrencyFromCents(simulation.totalDeliveredValueCents)}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-card p-3.5 border border-border">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    ROI Estimado à Marca
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ganho líquido: {formatCurrencyFromCents(simulation.netReturnCents)}
                  </p>
                </div>
                <div
                  className={`text-2xl font-extrabold font-mono ${
                    simulation.sponsorRoiPercent >= 0 ? "text-success" : "text-destructive"
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
    </DashboardShell>
  );
}
