"use client";

import * as React from "react";
import {
  Calendar,
  Eye,
  Megaphone,
  Plus,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { RETURN_ACTION_CATEGORY_LABELS } from "@/lib/constants";
import { formatCurrencyFromCents, formatDateBR } from "@/lib/utils";
import { deleteReturnActionAction } from "@/actions/financial-actions";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { useInvalidateDashboard } from "@/hooks/use-invalidate-dashboard";
import type { DashboardMetricsDTO, ReturnActionDTO } from "@/types/financial";
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
import { CreateReturnActionDialog } from "@/components/modals/create-return-action-dialog";

interface ReturnActionsViewProps {
  initialMetrics: DashboardMetricsDTO;
}

export function ReturnActionsView({ initialMetrics }: ReturnActionsViewProps) {
  const { metrics } = useDashboardMetrics({ initialData: initialMetrics });
  const data = metrics ?? initialMetrics;
  const invalidateDashboard = useInvalidateDashboard();
  const [isDeletingId, setIsDeletingId] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [selectedSponsorId, setSelectedSponsorId] = React.useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");

  const returnActions = data.returnActions ?? [];
  const sponsors = data.sponsors ?? [];

  const filteredActions = React.useMemo(() => {
    return returnActions.filter((action) => {
      if (selectedSponsorId !== "ALL" && action.sponsorId !== selectedSponsorId) {
        return false;
      }
      if (selectedCategory !== "ALL" && action.category !== selectedCategory) {
        return false;
      }
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = action.title.toLowerCase().includes(query);
        const matchesSponsor = action.sponsorName.toLowerCase().includes(query);
        const matchesDesc = action.description?.toLowerCase().includes(query);
        return matchesTitle || matchesSponsor || matchesDesc;
      }
      return true;
    });
  }, [returnActions, selectedSponsorId, selectedCategory, search]);

  const summary = React.useMemo(() => {
    const totalReturnCents = returnActions.reduce(
      (acc, a) => acc + a.returnCents,
      0
    );
    const totalReach = returnActions.reduce(
      (acc, a) => acc + (a.reachCount ?? 0),
      0
    );
    const uniqueSponsorsCount = new Set(returnActions.map((a) => a.sponsorId))
      .size;

    return {
      totalActionsCount: returnActions.length,
      totalReturnCents,
      totalReach,
      uniqueSponsorsCount,
    };
  }, [returnActions]);

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta ação de retorno?")) return;

    setIsDeletingId(id);
    try {
      const res = await deleteReturnActionAction({ id });
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
      title="Ações de Retorno aos Patrocinadores"
      subtitle="Registro auditável de entregas, exposições de marca e contrapartidas realizadas pela equipe"
      currentUser={data.currentUser}
      activeTeam={data.activeTeam}
      availableTeams={data.availableTeams}
      categories={data.categories}
      budgetResources={data.budgetResources}
      seasonMonths={data.seasonMonths}
      headerAction={
        <CreateReturnActionDialog sponsors={sponsors} />
      }
    >
      {/* 1. KPIs das Ações de Retorno */}
      <section
        aria-label="Indicadores de Ações de Retorno"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Total de Ações Realizadas
              </p>
              <p className="text-2xl font-extrabold tracking-tight text-foreground">
                {summary.totalActionsCount}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Megaphone className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Entregas comprovadas de visibilidade para marcas
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Retorno Total Entregue
              </p>
              <p className="text-2xl font-extrabold tracking-tight text-success">
                {formatCurrencyFromCents(summary.totalReturnCents)}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/15 text-success">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Valoração acumulada de mídia e ativações
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Alcance Total Estimado
              </p>
              <p className="text-2xl font-extrabold tracking-tight text-foreground">
                {summary.totalReach.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple/15 text-purple">
              <Eye className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Visualizações em redes sociais, eventos e estande
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Empresas Atendidas
              </p>
              <p className="text-2xl font-extrabold tracking-tight text-foreground">
                {summary.uniqueSponsorsCount} / {sponsors.length}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/15 text-warning">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Patrocinadores com ao menos uma entrega registrada
          </p>
        </div>
      </section>

      {/* 2. Barra de Filtros e Busca */}
      <Card className="border-border bg-card shadow-2xs">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, empresa ou evidência..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Select
                value={selectedSponsorId}
                onValueChange={setSelectedSponsorId}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Empresa Patrocinadora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas as Empresas</SelectItem>
                  {sponsors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Tipo de Ativação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Tipos</SelectItem>
                  {Object.entries(RETURN_ACTION_CATEGORY_LABELS).map(
                    ([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>

              {(search || selectedSponsorId !== "ALL" || selectedCategory !== "ALL") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setSelectedSponsorId("ALL");
                    setSelectedCategory("ALL");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Tabela de Ações de Retorno */}
      <Card className="border-border bg-card shadow-2xs">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base font-bold">
            Histórico de Entregas & Contrapartidas
          </CardTitle>
          <CardDescription className="text-xs">
            Lista de ações executadas que comprovam o retorno entregue a cada
            empresa parceira
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {filteredActions.length === 0 ? (
            <div className="p-8">
              <StateView
                state="empty"
                title="Nenhuma ação de retorno encontrada"
                description={
                  returnActions.length === 0
                    ? "Registre a primeira entrega da equipe (postagem, logo no carro, estande ou projeto social) para gerar retorno aos patrocinadores."
                    : "Nenhuma ação coincide com os filtros selecionados."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>DATA</TableHead>
                    <TableHead>EMPRESA PATROCINADORA</TableHead>
                    <TableHead>COTA</TableHead>
                    <TableHead>AÇÃO / ATIVAÇÃO</TableHead>
                    <TableHead>TIPO</TableHead>
                    <TableHead>ALCANCE</TableHead>
                    <TableHead className="text-right">RETORNO GERADO</TableHead>
                    <TableHead className="w-[60px] text-center">AÇÕES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActions.map((action) => (
                    <TableRow key={action.id}>
                      <TableCell className="text-xs font-medium text-foreground whitespace-nowrap">
                        {formatDateBR(action.date)}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground whitespace-nowrap">
                        {action.sponsorName}
                      </TableCell>
                      <TableCell>
                        <SponsorTierBadge tier={action.sponsorTier} size="sm" />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground">
                            {action.title}
                          </p>
                          {action.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {action.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {RETURN_ACTION_CATEGORY_LABELS[action.category]}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-foreground whitespace-nowrap">
                        {action.reachCount != null
                          ? action.reachCount.toLocaleString("pt-BR")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-bold text-success whitespace-nowrap">
                        {formatCurrencyFromCents(action.returnCents)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(action.id)}
                          disabled={isDeletingId === action.id}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                          aria-label={`Excluir ação ${action.title}`}
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
    </DashboardShell>
  );
}
